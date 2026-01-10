pub mod shortcut;
pub mod accessibility;
pub mod window;

#[cfg(target_os = "macos")]
pub mod panel;

pub use shortcut::setup_global_shortcut;

#[cfg(target_os = "macos")]
pub use panel::init_panel;
