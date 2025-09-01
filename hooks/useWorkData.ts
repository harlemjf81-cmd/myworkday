import { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, setDoc, onSnapshot, collection, writeBatch, query, where, documentId } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../firebase.ts';
import { FIRESTORE_COLLECTIONS, DEFAULT_THEME_COLORS, DEFAULT_OVERTIME_SETTINGS, DEFAULT_PAYMENT_REMINDER_DAYS } from '../constants.ts';
import { UserProfile, WorkSessionsMap, ExportedData } from '../types.ts';
import { formatDateISO } from '../utils/dateUtils.ts';

// Memoize month key calculation to avoid re-running on every render
const getMonthKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}`;

export function useWorkData(user: User | null, focusedDate: Date) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [workSessions, setWorkSessions] = useState<WorkSessionsMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadedMonths, setLoadedMonths] = useState<Set<string>>(new Set());

  // Effect to load user profile (runs once when user changes)
  useEffect(() => {
    if (!user || !db) {
      setLoading(false);
      setProfile(null);
      setWorkSessions({});
      return;
    }

    setLoading(true);
    const userDocRef = doc(db, FIRESTORE_COLLECTIONS.USERS, user.uid);

    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const profileData = docSnap.data() as UserProfile;
        setProfile({
            overtimeSettings: DEFAULT_OVERTIME_SETTINGS,
            paymentReminderDays: DEFAULT_PAYMENT_REMINDER_DAYS,
            themeColors: DEFAULT_THEME_COLORS,
            ...profileData,
        });
      } else {
        setProfile(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching user profile:", err);
      setError("Failed to load user profile.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);
  
  // Effect to load work sessions for the focused month
  const currentMonthKey = useMemo(() => getMonthKey(focusedDate), [focusedDate]);

  useEffect(() => {
    if (!profile || !db || loadedMonths.has(currentMonthKey)) {
        return;
    };

    const year = focusedDate.getFullYear();
    const month = focusedDate.getMonth();
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);

    const startOfMonthKey = formatDateISO(startOfMonth);
    const endOfMonthKey = formatDateISO(endOfMonth);

    const sessionsColRef = collection(db, FIRESTORE_COLLECTIONS.USERS, profile.uid, FIRESTORE_COLLECTIONS.WORK_SESSIONS);
    const q = query(sessionsColRef, 
        where(documentId(), '>=', startOfMonthKey),
        where(documentId(), '<=', endOfMonthKey)
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const monthlySessions: WorkSessionsMap = {};
        querySnapshot.forEach((doc) => {
            monthlySessions[doc.id] = doc.data() as any;
        });
        setWorkSessions(prevSessions => ({...prevSessions, ...monthlySessions}));
        setLoadedMonths(prev => new Set(prev).add(currentMonthKey));
    }, (err) => {
        console.error("Error fetching work sessions for month:", err);
        setError("Failed to load work sessions.");
    });
    
    return () => unsubscribe();

  }, [profile, focusedDate, currentMonthKey, loadedMonths]);

  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    if (!user || !db) return;
    const userDocRef = doc(db, FIRESTORE_COLLECTIONS.USERS, user.uid);
    try {
      await setDoc(userDocRef, data, { merge: true });
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile.");
    }
  }, [user]);

  const saveWorkSession = useCallback(async (dateKey: string, sessionData: any) => {
    if (!user || !db) return;
    const sessionDocRef = doc(db, FIRESTORE_COLLECTIONS.USERS, user.uid, FIRESTORE_COLLECTIONS.WORK_SESSIONS, dateKey);
    try {
      await setDoc(sessionDocRef, sessionData);
    } catch (err) {
      console.error("Error saving work session:", err);
      setError("Failed to save work session.");
    }
  }, [user]);
  
  const markSessionAsPaid = useCallback(async (dateKey: string) => {
    if (!user || !db) return;
    const sessionDocRef = doc(db, FIRESTORE_COLLECTIONS.USERS, user.uid, FIRESTORE_COLLECTIONS.WORK_SESSIONS, dateKey);
    try {
        await setDoc(sessionDocRef, { paymentPending: false }, { merge: true });
    } catch (err) {
        console.error("Error marking session as paid:", err);
        setError("Failed to update session payment status.");
    }
  }, [user]);
  
  const getDataForExport = useCallback((): ExportedData => {
    if (!profile || !user) {
        return {
            workSessions: {},
            hourlyRate: 0,
        };
    }
    return {
      uid: user.uid,
      workerName: profile.workerName,
      hourlyRate: profile.hourlyRate,
      overtimeSettings: profile.overtimeSettings,
      workSessions: workSessions,
      themeColors: profile.themeColors,
      idealDailyEarnings: profile.idealDailyEarnings,
      idealMonthlyEarnings: profile.idealMonthlyEarnings,
      paymentReminderDays: profile.paymentReminderDays,
      currencySymbol: profile.currencySymbol,
      dataTimestamp: new Date().toISOString(),
    };
  }, [profile, workSessions, user]);

  const loadDataFromExport = useCallback(async (data: ExportedData) => {
    if (!user || !db) {
      setError("User not authenticated or database not available.");
      return;
    }
    if (data.uid && data.uid !== user.uid) {
        const errorMessage = "This data file belongs to a different user.";
        setError(errorMessage);
        throw new Error(errorMessage);
    }
    try {
        const batch = writeBatch(db);
        const userDocRef = doc(db, FIRESTORE_COLLECTIONS.USERS, user.uid);
        const profileUpdate: Partial<UserProfile> = {
            workerName: data.workerName,
            hourlyRate: data.hourlyRate,
            overtimeSettings: data.overtimeSettings,
            themeColors: data.themeColors,
            idealDailyEarnings: data.idealDailyEarnings,
            idealMonthlyEarnings: data.idealMonthlyEarnings,
            paymentReminderDays: data.paymentReminderDays,
            currencySymbol: data.currencySymbol,
        };
        Object.keys(profileUpdate).forEach(key => {
            const k = key as keyof typeof profileUpdate;
            if (profileUpdate[k] === undefined) {
                delete profileUpdate[k];
            }
        });

        if (Object.keys(profileUpdate).length > 0) {
            batch.set(userDocRef, profileUpdate, { merge: true });
        }
        if (data.workSessions) {
            for (const dateKey in data.workSessions) {
                if (Object.prototype.hasOwnProperty.call(data.workSessions, dateKey)) {
                    const sessionData = data.workSessions[dateKey];
                    const sessionDocRef = doc(db, FIRESTORE_COLLECTIONS.USERS, user.uid, FIRESTORE_COLLECTIONS.WORK_SESSIONS, dateKey);
                    batch.set(sessionDocRef, sessionData);
                }
            }
        }
        await batch.commit();
    } catch (err) {
        console.error("Error importing data:", err);
        const errorMessage = "Failed to import data.";
        setError(errorMessage);
        throw new Error(errorMessage);
    }
  }, [user]);

  return {
    profile,
    workSessions,
    loading,
    error,
    updateProfile,
    saveWorkSession,
    markSessionAsPaid,
    getDataForExport,
    loadDataFromExport,
  };
}