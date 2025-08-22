export class ResourceInvoker {
  async run(command) {
    return command.execute();
  }
}

export default ResourceInvoker;


