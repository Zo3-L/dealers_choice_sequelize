const Sequelize = require('sequelize');
const {STRING, UUID, UUIDV4} = Sequelize;
const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_db');
const express = require ('express');
const app = express();

app.get('/api/departments', async(req, res, next)=>{
    try{
        res.send(await Department.findAll({
            include: [
                {
                    model: Employee,
                    as:'manager'
                }
            ]
        }));
    }
    catch(ex){
        next(ex);
    }
})

app.get('/api/employees', async(req, res, next)=>{
    try{
        res.send(await Employee.findAll({
            include:[
            {
                model: Employee,
                as:'supervisor',
            },
            Employee,
            Department
        ],
        }));
    }
    catch(ex){
        next(ex);
    }
})

const Department = conn.define ('Department',{
    name:{
        type: STRING(20)
    }
});

const Employee = conn.define('Employee',{
    id:{
        type: UUID,
        primaryKey : true,
        defaultValue: UUIDV4
    },
    name:{
        type: STRING(20)
    }
})

Department.belongsTo(Employee, {as: 'manager'});
Employee.hasMany(Department, {foreignKey: 'managerId'})

Employee.belongsTo(Employee, {as: 'supervisor'});
Employee.hasMany(Employee, {foreignKey:'supervisorId'})

const syncAndSeed = async() => {
    await conn.sync({force: true});
    const [moe, lucy, larry, hr, engineering] = await Promise.all ([
        Employee.create({name:'moe'}),
        Employee.create({name:'lucy'}),
        Employee.create({name:'larry'}),
        Department.create({name:'hr'}),
        Department.create({name:'engineering'})
    ]);
    hr.managerId = lucy.id;
    moe.supervisorId = lucy.id;
    larry.supervisorId = lucy.id;
    await hr.save();
    await Promise.all([
        moe.save(),
        larry.save()
    ]);
    // console.log(JSON.stringify(hr, null, 2));
}

const init = async() =>{
    try{
        await conn.authenticate();
        await syncAndSeed();
        const port = process.env.PORT || 3000;
        app.listen(port,()=>console.log(`listening on port ${port}`))
    }
    catch(ex){
        console.log(ex);
    }
}

init()