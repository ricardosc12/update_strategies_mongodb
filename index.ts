import express, { Request, Response } from 'express';
import { MongoClient, Db, ObjectId, BSON } from 'mongodb';
// import { faker, id_ID } from '@faker-js/faker';

const app = express();
const port = process.env.PORT || 3000;
const mongoUri = "mongodb://root:toor@127.0.0.1:27017";

let db: Db;

interface User {
    nome: string;
    position: number;
}

async function connectToDb() {
    const client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db();
    console.log('Connected to MongoDB');
}

// app.post('', async (req: Request, res: Response) => {
//     try {
//         const users: User[] = Array.from(Array(1000000)).map(_ => ({
//             nome: faker.person.firstName(),
//             position: 0
//         }))
//         await db.collection('users').insertMany(
//             users
//         );
//         res.status(200).send();
//     } catch (err) {
//         res.status(500).send(err);
//     }
// });

app.put('/for', async (req: Request, res: Response) => {
    try {
        if (!Array.isArray(req.query["users"])) {
            res.status(400).send();
            return;
        }

        //@ts-ignore
        const userIds: string[] = req.query["users"];

        const usersToUpdate = userIds.map(item => ({
            id: item,
            newPosition: 4
        }));

        const updatePromises = usersToUpdate.map(user =>
            db.collection('users').updateOne(
                { _id: new ObjectId(user.id) },
                {
                    $set: {
                        position: user.newPosition
                    }
                }
            )
        );

        const result = await Promise.all(updatePromises);

        res.status(200).send("for");

    } catch { }
})

app.put('/bulk', async (req: Request, res: Response) => {
    try {
        if (!Array.isArray(req.query["users"])) {
            res.status(400).send();
            return;
        }

        //@ts-ignore
        const userIds: string[] = req.query["users"];

        const usersToUpdate = userIds.map(item => ({
            id: item,
            newPosition: 3
        }));

        const bulkOps = usersToUpdate.map(user => ({
            updateOne: {
                filter: { _id: new ObjectId(user.id) },
                update: {
                    $set: {
                        position: user.newPosition
                    }
                }
            }
        }));

        const result = await db.collection('users').bulkWrite(bulkOps);

        res.status(200).send("bulk");

    } catch { }
})

app.put('/filter', async (req: Request, res: Response) => {
    try {
        if (!Array.isArray(req.query["users"])) {
            res.status(400).send();
            return;
        }

        //@ts-ignore
        const userIds: string[] = req.query["users"];

        const usersToUpdate: { id: ObjectId, newPosition: number }[] = userIds.map(item => ({
            id: new ObjectId(item),
            newPosition: 2
        }));

        const result = await db.collection('users').updateMany(
            { _id: { $in: userIds.map(item => new ObjectId(item)) } },
            [
                {
                    $set: {
                        position: {
                            "$let": {
                                "vars": {
                                    "obj": {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: usersToUpdate,
                                                    as: "kvpa",
                                                    cond: {
                                                        $eq: ["$$kvpa.id", "$_id"]
                                                    }
                                                }
                                            },
                                            0
                                        ]
                                    }
                                },
                                "in": "$$obj.newPosition"
                            }
                        }
                    }
                }
            ]);

        res.status(200).send("filter");

    } catch { }
})

app.put('/hash', async (req: Request, res: Response) => {
    try {

        if (!Array.isArray(req.query["users"])) {
            res.status(400).send();
            return;
        }

        //@ts-ignore
        const userIds: string[] = req.query["users"];

        let hash_users: Record<string, number> = {};

        for (const id of userIds) {
            hash_users[id] = 1;
        }

        const result = await db.collection('users').updateMany(
            { _id: { $in: userIds.map(item => new ObjectId(item)) } },
            [
                {
                    "$set": {
                        "position": {
                            "$let": {
                                "vars": {
                                    "new_position": {
                                        "$getField": {
                                            "field": {
                                                "$toString": "$_id"
                                            },
                                            "input": hash_users
                                        }
                                    }
                                },
                                "in": "$$new_position"
                            }
                        }
                    }
                }
            ]);
        res.status(200).send("hash");
    } catch (err) {
        res.status(500).send(err);
    }
});

app.listen(port, () => {
    console.log(`App running on http://localhost:${port}`);
});

connectToDb().catch(err => console.error(err));
