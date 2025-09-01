# Convertir la Aplicación React a APK de Android

Esta guía te ayudará a empaquetar tu aplicación React existente en un archivo APK que puede ser compilado con Android Studio, utilizando un enfoque de WebView.

## Prerrequisitos

1.  **Node.js y npm/yarn**: Para construir tu aplicación React.
2.  **Android Studio**: Instalado y configurado.
3.  **Aplicación React Construida**: Debes tener una versión de producción estática de tu aplicación.

## Pasos

### 1. Construye tu Aplicación React

Desde el directorio raíz de tu proyecto React (donde está `package.json`), ejecuta el comando de construcción:

```bash
npm run build
# o
yarn build
```

Esto generará una carpeta (usualmente `build` o `dist`) que contiene los archivos estáticos de tu aplicación (como `index.html`, archivos JS, CSS, imágenes, etc.).

### 2. Crea un Nuevo Proyecto en Android Studio

1.  Abre Android Studio.
2.  Selecciona "Start a new Android Studio project" (o "File" > "New" > "New Project...").
3.  Elige la plantilla "Empty Activity" y haz clic en "Next".
4.  Configura tu proyecto:
    *   **Name**: El nombre de tu aplicación (ej. `MyWorkdayApp`).
    *   **Package name**: Un nombre de paquete único (ej. `com.example.myworkday`).
    *   **Save location**: Donde guardar tu proyecto Android.
    *   **Language**: Elige **Kotlin** (recomendado) o Java. Los archivos de ejemplo proporcionados usarán Kotlin.
    *   **Minimum SDK**: Elige un nivel de API apropiado (ej. API 21 o superior).
5.  Haz clic en "Finish".

### 3. Copia los Activos Web Construidos

1.  En Android Studio, cambia a la vista "Project" en el panel izquierdo.
2.  Navega a `app/src/main/`.
3.  Haz clic derecho en la carpeta `main` y selecciona "New" > "Directory". Nombra el directorio `assets`.
4.  Copia **todo el contenido** de la carpeta `build` (o `dist`) de tu proyecto React (generada en el Paso 1) dentro de la carpeta `app/src/main/assets/` que acabas de crear.
    Tu estructura de `assets` debería verse así:
    ```
    app/src/main/assets/
        |- index.html
        |- static/ (o similar, dependiendo de tu build)
            |- css/
            |- js/
        |- manifest.json
        |- ... (otros archivos y carpetas de tu build)
    ```

### 4. Modifica `MainActivity.kt` (o `.java`)

Reemplaza el contenido de tu archivo `MainActivity.kt` (usualmente ubicado en `app/src/main/java/com/example/myworkday/MainActivity.kt`) con el siguiente código. Este código configura un WebView para cargar tu `index.html`.

```kotlin
package com.example.myworkday // Reemplaza con tu nombre de paquete

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main) // Asume que tienes un layout activity_main.xml

        webView = findViewById(R.id.webview) // Asume que tienes un WebView con id 'webview' en tu layout

        // Configuración del WebView
        webView.webViewClient = WebViewClient() // Para que los enlaces se abran dentro del WebView
        val webSettings: WebSettings = webView.settings
        webSettings.javaScriptEnabled = true      // Habilitar JavaScript
        webSettings.domStorageEnabled = true      // Habilitar DOM Storage (localStorage)
        webSettings.allowFileAccess = true        // Permitir acceso a archivos (necesario para file:///android_asset/)
        webSettings.allowContentAccess = true

        // Cargar la aplicación web desde la carpeta assets
        // Asegúrate de que tu archivo principal es index.html en la raíz de la carpeta assets
        webView.loadUrl("file:///android_asset/index.html")
    }

    // Manejar el botón de retroceso para navegar en el historial del WebView si es posible
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }
}
```

### 5. Modifica `activity_main.xml`

Asegúrate de que tu archivo de layout `app/src/main/res/layout/activity_main.xml` contenga un WebView. Reemplaza su contenido con algo como esto:

```xml
<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".MainActivity">

    <WebView
        android:id="@+id/webview"
        android:layout_width="0dp"
        android:layout_height="0dp"
        app:layout_constraintTop_toTopOf="parent"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent" />

</androidx.constraintlayout.widget.ConstraintLayout>
```

### 6. Edita `AndroidManifest.xml`

Abre `app/src/main/AndroidManifest.xml`. Necesitas añadir el permiso de Internet si tu aplicación web carga recursos externos (aunque es mejor empaquetar todo). Si tu app es completamente offline después de la construcción, este permiso podría no ser estrictamente necesario, pero es común tenerlo.

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.myworkday"> <!-- Reemplaza con tu nombre de paquete -->

    <!-- Permiso de Internet (si es necesario) -->
    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name" <!-- Definido en strings.xml -->
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.MyWorkdayApp" <!-- El tema de tu app Android -->
        android:usesCleartextTraffic="true"> <!-- Necesario para http si no usas HTTPS en Android 9+ -->
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
```
Asegúrate de que `android:label` y `android:theme` coincidan con lo que tienes en tu proyecto Android. Puedes encontrar `@string/app_name` en `app/src/main/res/values/strings.xml`.

### 7. Consideraciones Adicionales

*   **Rendimiento**: Las aplicaciones WebView pueden no ser tan fluidas como las nativas. Optimiza tu aplicación web tanto como sea posible.
*   **Acceso a Funciones Nativas**: Si necesitas acceder a funciones del dispositivo (cámara, GPS, etc.), necesitarás implementar "Javascript Interfaces" para comunicar el WebView con el código nativo Kotlin/Java. Herramientas como Apache Cordova o Capacitor simplifican esto.
*   **Modo Oscuro**: Si tu aplicación web tiene un modo oscuro, puedes sincronizarlo con el tema del sistema Android.
*   **Icono de la App**: Reemplaza los iconos por defecto (`ic_launcher`, `ic_launcher_round`) en las carpetas `mipmap` con los tuyos.
*   **Pantalla de Bienvenida (Splash Screen)**: Considera añadir una pantalla de bienvenida nativa para mejorar la experiencia de inicio.

### 8. Construye y Ejecuta tu APK

1.  En Android Studio, selecciona tu dispositivo o emulador.
2.  Haz clic en "Run" (el icono de play verde) o ve a "Build" > "Build Bundle(s) / APK(s)" > "Build APK(s)".

Siguiendo estos pasos, deberías poder empaquetar tu aplicación React en una APK.
Recuerda que este es un enfoque básico. Para una integración más profunda o un mejor rendimiento, podrías considerar React Native o desarrollo nativo completo.