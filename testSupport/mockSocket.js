class Socket {
  constructor() {
    this.functions = {};
  }
  on(title, callback) {
    this.functions[title] = callback;
  }
  call(title) {
    return this.functions[title];
  }
}

export class Io {
  constructor() {
    this.socket = new Socket();
  }
  on(title, callback) {
    if (title === 'connection') {
      callback(this.socket);
    }
  }
  call(title) {
    return this.socket.call(title);
  }
  get sockets() {
    return {
      emit: function() {}
    }
  }
}
