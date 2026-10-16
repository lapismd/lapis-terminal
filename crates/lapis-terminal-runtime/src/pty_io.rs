//! Audited Unix PTY descriptor operations. The caller keeps the master alive.
#[cfg(unix)]
pub fn nonblocking(fd: i32) -> std::io::Result<()> {
    // SAFETY: fcntl consumes a live borrowed descriptor, no pointer arguments.
    let flags = unsafe { libc::fcntl(fd, libc::F_GETFL) };
    if flags < 0 || unsafe { libc::fcntl(fd, libc::F_SETFL, flags | libc::O_NONBLOCK) } < 0 {
        return Err(std::io::Error::last_os_error());
    }
    Ok(())
}
#[cfg(unix)]
pub fn readable(fd: i32) -> bool {
    let mut item = libc::pollfd {
        fd,
        events: libc::POLLIN,
        revents: 0,
    };
    // SAFETY: item lives for the duration of poll, which receives its exact size.
    unsafe { libc::poll(&mut item, 1, 25) > 0 }
}
