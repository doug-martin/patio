"use strict";

var patio = require("../../../lib"),
    helper = require("../../helper"),
    db = helper.connect("sandbox");

var Class = patio
    .addModel("class")
    .manyToMany("students", {joinTable: "studentsClasses"})
    .manyToMany("aboveAverageStudents", {model: "student", joinTable: "studentsClasses"}, function (ds) {
        return ds.filter({gpa: {gte: 3.5}});
    })
    .manyToMany("averageStudents", {model: "student", joinTable: "studentsClasses"}, function (ds) {
        return ds.filter({gpa: {between: [2.5, 3.5]}});
    })
    .manyToMany("belowAverageStudents", {model: "student", joinTable: "studentsClasses"}, function (ds) {
        return ds.filter({gpa: {lt: 2.5}});
    });

var Student = patio
    .addModel("student", {
        instance: {
            enroll: function (clas) {
                if (Array.isArray(clas)) {
                    return this.addClasses(clas);
                } else {
                    return this.addClass(clas);
                }
            }
        }
    })
    .manyToMany("classes", {joinTable: "studentsClasses"});

module.exports = runExample;

function runExample() {
    return setup()
        .then(enrollStudents)
        .then(createEnrolledStudent)
        .then(queryStudents)
        .then(queryClasses)
        .then(teardown)
        .catch(fail);
}

function enrollStudents(classes) {
    helper.header("ENROLLING STUDENTS");
    return Class.order("name").all().then(function (classes) {
        return Student.order("firstName", "lastName")
            .forEach(function (student, i) {
                if (i === 0) {
                    return student.enroll(classes);
                } else if (i < classes.length) {
                    return student.enroll(classes.slice(i));
                }
            });
    });
}

function createEnrolledStudent() {
    helper.header("CREATING ENROLLED STUDENT");
    return Student.save({
        firstName: "Zach",
        lastName: "Igor",
        gpa: 2.754,
        classYear: "Sophmore",
        classes: [
            {
                semester: "FALL",
                name: "Compiler Construction 2",
                subject: "Computer Science",
                description: "More Assemblers, interpreters and compilers. Compilation of simple expressions and statements. " +
                "Analysis of regular expressions. Organization of a compiler, including compile-time and run-time " +
                "symbol tables, lexical scan, syntax scan, object code generation and error diagnostics."
            },

            {
                semester: "FALL",
                name: "Operating Systems",
                subject: "Computer Science"
            }
        ]
    });
}

function queryStudents() {
    helper.header("QUERYING STUDENTS");
    return Student.order("firstName", "lastName").forEach(function (student) {
        return student.classes.then(function (classes) {
            helper.log("%s %s is enrolled in %s", student.firstName, student.lastName, formatClasses(classes));
        });
    });
}


function queryClasses() {
    helper.header("QUERYING CLASSES");
    //print the results
    return Class.order("name").forEach(function (cls) {
        helper.log('Class "%s"', cls.name);
        return cls.students
            .then(function (students) {
                helper.log('      Enrolled students: %s', formatStudents(students));
                return cls.aboveAverageStudents;
            })
            .then(function (aboveAverageStudents) {
                helper.log('      Enrolled above average students: %s', formatStudents(aboveAverageStudents));
                return cls.averageStudents;
            })
            .then(function (averageStudents) {
                helper.log('      Enrolled average students: %s', formatStudents(averageStudents));
                return cls.belowAverageStudents;
            })
            .then(function (belowAverageStudents) {
                helper.log('      Enrolled below average students: %s', formatStudents(belowAverageStudents));
            });
    }, 1);
}

//HELPER METHODS

function formatStudents(students) {
    var sep = "\n            -";
    return sep + students.map(function (student) {
            return student.firstName + " " + student.lastName;
        }).join(sep);
}

function formatClasses(classes) {
    return !classes.length ? " no classes!" : "\n      -" + classes.map(function (clas) {
        return clas.name;
    }).join("\n      -");
}


function setup() {
    return db
        .forceDropTable("studentsClasses", "class", "student")
        .then(function () {
            return db.createTable("class", function () {
                this.primaryKey("id");
                this.semester("string", {size: 10});
                this.name(String);
                this.subject(String);
                this.description("text");
                this.graded(Boolean, {"default": true});
            });
        })
        .then(function () {
            return db.createTable("student", function () {
                this.primaryKey("id");
                this.firstName(String);
                this.lastName(String);
                //GPA
                this.gpa(patio.sql.Decimal, {size: [1, 3], "default": 0.0});
                //Honors Program?
                this.isHonors(Boolean, {"default": false});
                //freshman, sophmore, junior, or senior
                this.classYear("string");
            });
        })
        .then(function () {
            return db.createTable("studentsClasses", function () {
                this.foreignKey("studentId", "student", {key: "id"});
                this.foreignKey("classId", "class", {key: "id"});
            });
        })
        .then(patio.syncModels)
        .then(createData);
}


function createData() {
    return Class
        .save([
            {
                semester: "FALL",
                name: "Intro To JavaScript",
                subject: "Javascript!!!!",
                description: "This class will teach you about javascript's many uses!!!"
            },
            {
                semester: "FALL",
                name: "Pricipals Of Programming Languages",
                subject: "Computer Science",
                description: "Definition of programming languages. Global properties of algorithmic languages including " +
                "scope of declaration, storage allocation, grouping of statements, binding time. Subroutines, " +
                "coroutines and tasks. Comparison of several languages."
            },
            {
                semester: "FALL",
                name: "Theory Of Computation",
                subject: "Computer Science",
                description: "The course is intended to introduce the students to the theory of computation in a fashion " +
                "that emphasizes breadth and away from detailed analysis found in a normal undergraduate automata " +
                "course. The topics covered in the course include methods of proofs, finite automata, non-determinism," +
                " regular expressions, context-free grammars, pushdown automata, no-context free languages, " +
                "Church-Turing Thesis, decidability, reducibility, and space and time complexity.."
            },
            {
                semester: "SPRING",
                name: "Compiler Construction",
                subject: "Computer Science",
                description: "Assemblers, interpreters and compilers. Compilation of simple expressions and statements. " +
                "Analysis of regular expressions. Organization of a compiler, including compile-time and run-time " +
                "symbol tables, lexical scan, syntax scan, object code generation and error diagnostics."
            }
        ])
        .then(function () {
            return Student.save([
                {
                    firstName: "Bob",
                    lastName: "Yukon",
                    gpa: 3.689,
                    classYear: "Senior"
                },
                {
                    firstName: "Greg",
                    lastName: "Horn",
                    gpa: 3.689,
                    classYear: "Sohpmore"
                },

                {
                    firstName: "Sara",
                    lastName: "Malloc",
                    gpa: 4.0,
                    classYear: "Junior"
                },
                {
                    firstName: "John",
                    lastName: "Favre",
                    gpa: 2.867,
                    classYear: "Junior"
                },
                {
                    firstName: "Kim",
                    lastName: "Bim",
                    gpa: 2.24,
                    classYear: "Senior"
                },
                {
                    firstName: "Alex",
                    lastName: "Young",
                    gpa: 1.9,
                    classYear: "Freshman"
                }
            ]);
        });
}

function teardown() {
    return db.dropTable("studentsClasses", "class", "student")
}

function fail(err) {
    console.log(err.stack);
    return teardown().then(function () {
        return Promise.reject(err);
    });
}
