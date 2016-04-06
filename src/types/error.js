/*
 * class opensig/OpenSigError
 *
 * Error class plus functions to raise different categories of error.  All errors 
 * thrown by OpenSig are of type OpenSigError.
 */
 
OpenSigError = function( code, error, details ){

    this.name = 'OpenSigError';
    this.code = code;
    this.message = error;
    this.details = details;
    this.stack = (new Error()).stack;

}

OpenSigError.prototype = new Error;

module.exports.OpenSigError = OpenSigError;

module.exports.InternalError = 
	function( msg, details ){ return new OpenSigError(100, "Internal Error! "+msg, details); }

module.exports.ArgumentError = 
	function( msg, details ){ return new OpenSigError(200, msg, details); }

module.exports.FileSystemError = 
	function( err ){ return new OpenSigError(300, decodeFSError(err), err); }

module.exports.BlockchainError = 
	function(msg, details){ return new OpenSigError(500, msg, details); }

module.exports.InsufficientFundsError = 
	function(){ return new OpenSigError(600, "insufficient funds"); }

module.exports.BlockchainNotFoundError = 
	function(err){ return new OpenSigError(700, "Blockchain not accessible.  Try again later.", err); }

module.exports.TestError = 
	function( msg, details ){ return new OpenSigError(-100, msg, details); }

module.exports.TestHarnessError = 
	function( msg, details ){ return new OpenSigError(-200, msg, details); }


FS_ERROR_CODES = {
	E2BIG: "argument list too long",
	EACCES: "permission denied",
	EADDRINUSE: "address already in use",
	EADDRNOTAVAIL: "address not available",
	EAFNOSUPPORT: "address family not supported",
	EAGAIN: "resource temporarily unavailable",
	EAI_ADDRFAMILY: "address family not supported",
	EAI_AGAIN: "temporary failure",
	EAI_BADFLAGS: "bad ai_flags value",
	EAI_BADHINTS: "invalid value for hints",
	EAI_CANCELED: "request canceled",
	EAI_FAIL: "permanent failure",
	EAI_FAMILY: "ai_family not supported",
	EAI_MEMORY: "out of memory",
	EAI_NODATA: "no address",
	EAI_NONAME: "unknown node or service",
	EAI_OVERFLOW: "argument buffer overflow",
	EAI_PROTOCOL: "resolved protocol is unknown",
	EAI_SERVICE: "service not available for socket type",
	EAI_SOCKTYPE: "socket type not supported",
	EAI_SYSTEM: "system error",
	EALREADY: "connection already in progress",
	EBADF: "bad file descriptor",
	EBUSY: "resource busy or locked",
	ECANCELED: "operation canceled",
	ECHARSET: "invalid Unicode character",
	ECONNABORTED: "software caused connection abort",
	ECONNREFUSED: "connection refused",
	ECONNRESET: "connection reset by peer",
	EDESTADDRREQ: "destination address required",
	EEXIST: "file already exists",
	EFAULT: "bad address in system call argument",
	EFBIG: "file too large",
	EHOSTUNREACH: "host is unreachable",
	EINTR: "interrupted system call",
	EINVAL: "invalid argument",
	EIO: "i/o error",
	EISCONN: "socket is already connected",
	EISDIR: "illegal operation on a directory",
	ELOOP: "too many symbolic links encountered",
	EMFILE: "too many open files",
	EMSGSIZE: "message too long",
	ENAMETOOLONG: "name too long",
	ENETDOWN: "network is down",
	ENETUNREACH: "network is unreachable",
	ENFILE: "file table overflow",
	ENOBUFS: "no buffer space available",
	ENODEV: "no such device",
	ENOENT: "no such file or directory",
	ENOMEM: "not enough memory",
	ENONET: "machine is not on the network",
	ENOPROTOOPT: "protocol not available",
	ENOSPC: "no space left on device",
	ENOSYS: "function not implemented",
	ENOTCONN: "socket is not connected",
	ENOTDIR: "not a directory",
	ENOTEMPTY: "directory not empty",
	ENOTSOCK: "socket operation on non-socket",
	ENOTSUP: "operation not supported on socket",
	EPERM: "operation not permitted",
	EPIPE: "broken pipe",
	EPROTO: "protocol error",
	EPROTONOSUPPORT: "protocol not supported",
	EPROTOTYPE: "protocol wrong type for socket",
	ERANGE: "result too large",
	EROFS: "read-only file system",
	ESHUTDOWN: "cannot send after transport endpoint shutdown",
	ESPIPE: "invalid seek",
	ESRCH: "no such process",
	ETIMEDOUT: "connection timed out",
	ETXTBSY: "text file is busy",
	EXDEV: "cross-device link not permitted",
	UNKNOWN: "unknown error",
	EOF: "end of file",
	ENXIO: "no such device or address",
	EMLINK: "too many links" };

decodeFSError = function( err ){
	if( err.code == undefined ) return err;
	else if( err.code in FS_ERROR_CODES ) return FS_ERROR_CODES[err.code] + " " + err.path;
	else return "unknown error accessing " + err.path;
};

