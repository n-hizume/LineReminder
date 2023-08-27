class AlreadyExistError extends Error {
  constructor(message) {
    super(message);
    this.name = "AlreadyExistError";
  }
}

class LineTransmissionError extends Error {
  constructor(message) {
    super(message);
    this.name = "LineSendError";
  }
}
