use std::fs;
use tauri::{AppHandle, Emitter, Manager};

#[cfg(target_os = "macos")]
use core_foundation::{
    base::TCFType,
    boolean::CFBoolean,
    dictionary::CFDictionary,
    string::{CFString, CFStringRef},
};

#[cfg(target_os = "macos")]
extern "C" {
    fn AXIsProcessTrusted() -> bool;
    fn AXIsProcessTrustedWithOptions(options: *const std::ffi::c_void) -> bool;
    static kAXTrustedCheckOptionPrompt: CFStringRef;
}

fn get_prompt_flag_path(app_handle: &AppHandle) -> Option<std::path::PathBuf> {
    let document_dir = tauri::path::BaseDirectory::Document;
    let data_dir = app_handle.path().resolve("PromptFlow", document_dir).ok()?;
    let _ = fs::create_dir_all(&data_dir);
    Some(data_dir.join("accessibility_prompted"))
}

pub fn ensure_accessibility_prompted_once(app_handle: &AppHandle) {
    #[cfg(not(target_os = "macos"))]
    {
        let _ = app_handle;
    }

    #[cfg(target_os = "macos")]
    {
        #[link(name = "ApplicationServices", kind = "framework")]
        extern "C" {}

        let Some(flag_path) = get_prompt_flag_path(app_handle) else {
            return;
        };

        if flag_path.exists() {
            return;
        }

        let trusted = unsafe { AXIsProcessTrusted() };
        if trusted {
            let _ = fs::write(flag_path, "1");
            return;
        }

        let prompt_key = unsafe { CFString::wrap_under_get_rule(kAXTrustedCheckOptionPrompt) };
        let prompt_value = CFBoolean::true_value();
        let options = CFDictionary::from_CFType_pairs(&[(prompt_key, prompt_value)]);

        let _ = unsafe { AXIsProcessTrustedWithOptions(options.as_concrete_TypeRef() as *const std::ffi::c_void) };
        let _ = fs::write(flag_path, "1");

        let _ = app_handle.emit("accessibility-permission-requested", ());
    }
}
