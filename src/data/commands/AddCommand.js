import Command from './Command.js';

export class AddCommand extends Command {
  constructor(repository, data) {
    super();
    this.repository = repository;
    this.data = data;
  }

  async execute() {
    return this.repository.add(this.data);
  }
}

export default AddCommand;


