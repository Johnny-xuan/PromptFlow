mod commands;
mod models;
mod services;
mod utils;

use commands::{
    // File commands
    get_data_directory, read_file, write_file, list_files, delete_file, file_exists,
    get_all_prompts, get_favorites, get_templates, create_prompt, update_prompt, 
    delete_prompt, increment_use_count, export_data_dir, init_repository,
    // Config commands
    load_config, save_config, reset_config, get_api_key, set_api_key,
    // Window commands
    toggle_window, show_window, hide_window, set_window_position, get_window_position,
    set_window_size, center_window, set_always_on_top, minimize_window, close_window,
};

use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, TrayIconBuilder, TrayIconEvent};
use tauri::Manager;


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build());
    
    #[cfg(target_os = "macos")]
    {
        builder = builder.plugin(tauri_nspanel::init());
    }
    
    builder.setup(|app| {
            let app_handle = app.handle().clone();
            
            #[cfg(target_os = "macos")]
            services::init_panel(&app_handle);
            
            if let Err(e) = services::setup_global_shortcut(&app_handle) {
                eprintln!("Failed to setup global shortcut: {}", e);
            }

            services::accessibility::ensure_accessibility_prompted_once(&app_handle);

            // Setup Tray Icon
            let quit_i = MenuItem::with_id(app, "quit", "Quit PromptFlow", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            // 使用应用默认图标作为 tray icon
            let icon = app.default_window_icon().cloned().unwrap();

            let _tray = TrayIconBuilder::new()
                .icon(icon)
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| {
                    match event.id().as_ref() {
                        "quit" => {
                            app.exit(0);
                        }
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_always_on_top(true);
                                let _ = window.set_focus();
                            }
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_always_on_top(true);
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app)?;
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // File commands
            get_data_directory,
            read_file,
            write_file,
            list_files,
            delete_file,
            file_exists,
            get_all_prompts,
            get_favorites,
            get_templates,
            create_prompt,
            update_prompt,
            delete_prompt,
            increment_use_count,
            export_data_dir,
            init_repository,
            // Config commands
            load_config,
            save_config,
            reset_config,
            get_api_key,
            set_api_key,
            // Window commands
            toggle_window,
            show_window,
            hide_window,
            set_window_position,
            get_window_position,
            set_window_size,
            center_window,
            set_always_on_top,
            minimize_window,
            close_window,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
