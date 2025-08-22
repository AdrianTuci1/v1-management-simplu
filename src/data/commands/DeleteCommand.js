import Command from './Command.js';

export class DeleteCommand extends Command {
  constructor(repository, id) {
    super();
    this.repository = repository;
    this.id = id;
  }

  async execute() {
    return this.repository.remove(this.id);
  }
}

export default DeleteCommand;


