import Command from './Command.js';

export class GetCommand extends Command {
  constructor(repository, params = {}) {
    super();
    this.repository = repository;
    this.params = params;
  }

  async execute() {
    return this.repository.query(this.params);
  }
}

export default GetCommand;


