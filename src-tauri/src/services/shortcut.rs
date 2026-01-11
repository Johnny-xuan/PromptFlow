use tauri::AppHandle;
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

#[cfg(target_os = "macos")]
use super::panel;

pub fn setup_global_shortcut(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    // macOS: Option + Space
    // Windows/Linux: Ctrl + Space (Alt + Space conflicts with Windows system menu)
    #[cfg(target_os = "macos")]
    let shortcut = Shortcut::new(Some(Modifiers::ALT), Code::Space);
    
    #[cfg(not(target_os = "macos"))]
    let shortcut = Shortcut::new(Some(Modifiers::CONTROL), Code::Space);
    
    let app_handle = app.clone();
    
    app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
        if event.state == ShortcutState::Pressed {
            eprintln!("[PromptFlow] hotkey fired!");
            
            #[cfg(target_os = "macos")]
            {
                panel::toggle_panel(&app_handle);
            }
            
            #[cfg(not(target_os = "macos"))]
            {
                use tauri::Manager;
                if let Some(window) = app_handle.get_webview_window("main") {
                    if window.is_visible().unwrap_or(false) {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
        }
    })?;
    
    Ok(())
}
