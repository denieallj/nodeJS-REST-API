const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app} = require('./../server');
const {Todo} = require("./../model/todo");

// Dummy data
// new ObjectID() method generates a random id automatically.
const todos = [
    {_id: new ObjectID(), text: "First todo"},
    {_id: new ObjectID(), text: "Second todo"}
];

// Testing lifecycle method
// Do something before the test cases are executed.
// Only will run the test case after done is called
beforeEach((done) => {
    // Delete all data in todos collection
    Todo.deleteMany({}).then(() => {

        return Todo.insertMany(todos);

    }).then(
        () => {
            done();
        }
    );
});

describe('POST /todos', () => {

    it("should create a new todo", (done) => {
        let text = "Test todo text";

        request(app)
        .post('/todos')
        .send({text})
        .expect(200)
        .expect(
            (res) => {
                expect(res.body.text).toBe(text);
            }
        )
        .end(
            (err, res) => {

                if (err) {
                    return done(err);
                }

                Todo.find({}, null, null).exec(
                    (err, todos) => {

                        if (err) {
                            return done(err);
                        }

                        expect(todos.length).toBe(3);
                        expect(todos[2].text).toBe(text);
                        done();
                    }
                );

            }
        );
    });


    it('Should not create todo with invalid data', (done) => {
        request(app)
        .post('/todos')
        .send({})
        .expect(400)
        .end((err, res) => {
            expect(res.body).toEqual({});

            Todo.countDocuments({}, (err, count) => {
                expect(count).toBe(2);
                done();
            });

        });
    });
});

describe("GET /todos", () => {

    it('Should get all todos', (done) => {
        request(app)
        .get('/todos')
        .expect((res) => {
            expect(res.body.length).toBe(2);
        }).end((err, res) => {
            expect(res.body.todos[0]).toInclude(todos[0]);
            done();
        });
    });

});

describe("Get /todos/{id}", () => {

    it('Should get one todo with the provided id', (done) => {
        request(app)
        .get(`/todos/${todos[0]._id.toHexString()}`) // convert the _id object into a string
        .expect(200)
        .end(
            (err, res) => {
                expect(res.body.todo.text).toBe(todos[0].text);
                done();
            }
        )
    });

    it('Should return nothing if todo not found', (done) => {
        request(app)
            .get(`/todos/${new ObjectID().toHexString()}`)
            .expect(404)
            .end(
                (err, res) => {
                    expect(res.body).toEqual({});
                    done();
                }
            )
    });

});
