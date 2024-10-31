import { Collection, Entity, LoadStrategy, ManyToOne, MikroORM, OneToMany, PrimaryKey, PrimaryKeyProp, Property } from '@mikro-orm/mssql';

@Entity()
class Client {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;


  @OneToMany(() => EmployeeClients, employee => employee.client,  { strategy: LoadStrategy.JOINED } )
  employeeClients = new Collection<EmployeeClients>(this);


  constructor(name: string, email: string) {
    this.name = name;
  }

}

@Entity()
class Employee {

  @PrimaryKey()
  id!: number;

  @Property()
  name: string;

  constructor(name: string, email: string) {
    this.name = name;
  }

}

@Entity()
class EmployeeClients {

  [PrimaryKeyProp]?: ['client', 'employee'];
  
  // FIELD NAME DOES NOT WORK ON DELETE AND UPDATES MANY TO ONE
  @ManyToOne({ entity: () => Client, primary: true, fieldName: 'client_id' })
  client!: Client;

  // FIELD NAME DOES NOT WORK ON DELETE AND UPDATES MANY TO ONE
  @ManyToOne({ entity: () => Employee, primary: true,  fieldName: 'employee_id', strategy: LoadStrategy.JOINED  })
  employee!: Employee;

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: "reproduction",
    host: 'host',
    user: 'user',
    password: 'password',
    entities: [Client, Employee, EmployeeClients],
    debug: ["query", "query-params"],
    allowGlobalContext: true
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.schema.dropSchema();
  await orm.close(true);
});

test('basic CRUD example', async () => {
 await orm.em.create(Client,{
    id: 1,
    name: 'The client'
  });

 await orm.em.create(Employee,{
    id: 1,
    name: 'The employee'
  });

  await orm.em.create(EmployeeClients,{
    employee: 1,
    client: 1
  });

  orm.em.flush();

  await orm.em.begin();

  try {
    let find = await orm.em.find(EmployeeClients, { client: 1, employee: 1 });

      await orm.em.remove(find);
      await orm.em.flush();
      await orm.em.commit();
  } catch(e) {
      await orm.em.rollback();
      throw e;
  }
 





});
