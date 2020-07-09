import Repository from '../repository'
import logger from '../../logger'

export default abstract class Model<Record,Json> {
  constructor(
    protected readonly table: string,
    protected readonly conflicts: string[],
    protected readonly repository: Repository,
  ) {}
  public async save(): Promise<Model<Record,Json>> {
    try {
      await this.repository.upsert(this.table, this.toRecord(), this.conflicts)
      return this
    } catch (err) {
      logger.error(err)
    }
    return null
  }
  public async delete(): Promise<any> {
    return this.repository.delete(this.table, this.toRecord())
  }
  public abstract toRecord(): Record
  public abstract toJson(): Json
}
