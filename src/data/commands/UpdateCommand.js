import Command from './Command.js';

export class UpdateCommand extends Command {
  constructor(repository, id, data) {
    super();
    this.repository = repository;
    this.id = id;
    this.data = data;
  }

  async execute() {
    return this.repository.update(this.id, this.data);
  }
}

export default UpdateCommand;


