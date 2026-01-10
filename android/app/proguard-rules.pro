# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# Keep React Native and its bridge
-keep class com.facebook.react.** { *; }
-keep class com.facebook.fbreact.** { *; }
-dontwarn com.facebook.react.**

# Keep your custom app classes (com.discountdost)
-keep class com.discountdost.** { *; }

# Keep React Native Vector Icons
-keep class com.oblador.vectoricons.** { *; }

# Axios & Networking
-keepattributes Signature, InnerClasses, AnnotationDefault
-keep class com.facebook.react.modules.network.** { *; }

# OkHttp (used by React Native/Axios)
-keepattributes Signature
-keepattributes *Annotation*
-keep class okhttp3.** { *; }
-dontwarn okhttp3.**

# React Native Async Storage
-keep class com.reactnativecommunity.asyncstorage.** { *; }