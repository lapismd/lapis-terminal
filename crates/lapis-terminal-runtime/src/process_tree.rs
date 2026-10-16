//! macOS shell job cleanup, including jobs in their own process groups.
//! PID start times are rechecked before signalling a retained child identity.
#[cfg(target_os = "macos")]
#[derive(Clone)]
pub struct Process {
    pid: i32,
    started: (u64, u64),
}
#[cfg(target_os = "macos")]
fn identity(pid: i32) -> Option<Process> {
    // SAFETY: proc_bsdinfo is a plain C output struct; its complete allocation is passed.
    let mut info: libc::proc_bsdinfo = unsafe { std::mem::zeroed() };
    let size = std::mem::size_of_val(&info) as i32;
    let count = unsafe {
        libc::proc_pidinfo(
            pid,
            libc::PROC_PIDTBSDINFO,
            0,
            (&mut info as *mut libc::proc_bsdinfo).cast(),
            size,
        )
    };
    (count == size).then_some(Process {
        pid,
        started: (info.pbi_start_tvsec, info.pbi_start_tvusec),
    })
}
#[cfg(target_os = "macos")]
pub fn descendants(root: i32) -> std::io::Result<Vec<Process>> {
    let mut parents = vec![root];
    let mut result = Vec::new();
    let mut visited = std::collections::HashSet::new();
    while let Some(parent) = parents.pop() {
        if !visited.insert(parent) {
            continue;
        }
        if visited.len() > 4096 {
            return Err(std::io::Error::other(
                "Terminal process tree exceeds cleanup limit",
            ));
        }
        let mut children = [0i32; 1024];
        // SAFETY: children is writable for exactly the byte length supplied.
        // libproc returns a PID count, although its buffer length is in bytes.
        let count = unsafe {
            libc::proc_listchildpids(
                parent,
                children.as_mut_ptr().cast(),
                std::mem::size_of_val(&children) as i32,
            )
        };
        if count < 0 {
            return Err(std::io::Error::last_os_error());
        }
        if count as usize >= children.len() {
            return Err(std::io::Error::other(
                "Terminal child list exceeds cleanup limit",
            ));
        }
        for pid in children
            .into_iter()
            .take(count as usize)
            .filter(|pid| *pid > 1 && *pid != root)
        {
            if let Some(process) = identity(pid) {
                result.push(process);
                parents.push(pid);
            }
        }
    }
    Ok(result)
}
#[cfg(target_os = "macos")]
pub fn signal(processes: &[Process], force: bool) {
    for process in processes.iter().rev() {
        if identity(process.pid).is_some_and(|current| current.started == process.started) {
            // SAFETY: positive pid is an observed child with a revalidated start identity.
            unsafe {
                libc::kill(
                    process.pid,
                    if force { libc::SIGKILL } else { libc::SIGTERM },
                );
            }
        }
    }
}
