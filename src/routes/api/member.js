// OBSOLETE FILE, NOT FOLLOWING CURRENT IDEAS, Change the endpoints to new model !

import express from "express";
import knex from "../../db/index.js";
import { validationResult } from "express-validator";
import {successHandler,
  requestErrorHandler,  
  databaseErrorHandler,
  validationErrorHandler,
} from "../../responseHandlers/index.js";

import {validateMember} from '../../validationHandler/index.js'

const member = express.Router();

//GET all contributors
// http://localhost:8777/api/member/all/contributors

member.get("/old/all/contributors", function (req, res) {
  let subquery = knex("Idea_Member").distinct("memberId");
  knex('Member').whereIn('id', subquery)
  .then(data => {
    successHandler(res, data, "member.get/all: Mebers listed ok from DB");
  })
  .catch((error) => {
    if(error.errno===1146) {
      databaseErrorHandler(res, error, "member.get/all: Database table Member not created. ");
    } else {
      databaseErrorHandler(res, error, "member.get/all: ");
    }
  });
});

member.get("/all/contributors", function (req, res) {
  knex
    .select()
    .from("Member")
    .then(data => {
      successHandler(res, data, "member.get/all: Contributors listed ok from DB");
    })
    .catch((error) => {
      if(error.errno===1146) {
        databaseErrorHandler(res, error, "member.get/all: Database table Member not created. ");
      } else {
        databaseErrorHandler(res, error, "member.get/all: ");
      }
    });
});

//GET all members
// http://localhost:8777/api/member/all

member.get("/all", function (req, res) {
  knex
    .select()
    .from("Member")
    .then(data => {
      successHandler(res, data, "member.get/all: Contributors listed ok from DB");
    })
    .catch((error) => {
      if(error.errno===1146) {
        databaseErrorHandler(res, error, "member.get/all: Database table Member not created. ");
      } else {
        databaseErrorHandler(res, error, "member.get/all: ");
      }
    });
});

// ADD NEW MEMBER
/** http://localhost:8777/api/member/    with method=POST **/

member.post("/", validateMember, function (req, res) {
  const valResult = validationResult(req);
  if (!valResult.isEmpty()) {
    return validationErrorHandler(res, valResult, "validateMember error");
  }
  if (req.body.firstName && req.body.lastName && req.body.email) {
    knex
      .insert(req.body)
      .returning("*")
      .into("Member")

      .then((idArray) => {
        successHandler(res, idArray, 
          "Adding a meber, or multiple members was succesful");
        // Note, will send: [101] or [101,102], an array with all the auto-increment
        // ids for the newly added object(s).
      })
      .catch(error => {
        if (error.errno == 1062) {
          // 1062? Seek from https://mariadb.com/kb/en/library/mariadb-error-codes/
          requestErrorHandler(res, `Member with the name ${req.body.name} already exists!`);
        } else {
          databaseErrorHandler(res, error);
        }
      });
  } else {
    res.status(400);
    res.send(
      JSON.stringify({
        error: "first name and /or last name and/or email is missing."
      })
    );
  }
});

// members by id --
/** http://localhost:8777/api/member/    with method=GET **/
// example: http://localhost:8777/api/member/1
// This was somehow checked/fixed 2020-02-25
member.get("/:id", function (req, res) {
  if( isNaN(req.params.id)) {
    requestErrorHandler(res, "Member id should be number and this is not: " + req.params.id);
  } else if(req.params.id < 1) {
    requestErrorHandler(res, "Member id should be >= 1 and this is not: " + req.params.id);
  } else {
    knex
    .select()
    .from("Member")
    .where("id", req.params.id)
      .then((data) => {
        if (data.length === 1) {
          successHandler(res, data);
        } else {
          requestErrorHandler(res, "Non-existing member id: " + req.params.id);
        }
      })
      .catch((error) => {
        databaseErrorHandler(res, error);
    });

}});

/** http://localhost:8777/api/member/:id    with method=DELETE **/
member.delete("/:id", function (req, res) {
  knex("Member")
    .where("id", req.params.id)
    .del()
    .then(rowsAffected => {
      if (rowsAffected === 1) {
        successHandler(res, rowsAffected,
           "Delete successful! Count of deleted rows: " + rowsAffected);
      } else {
        requestErrorHandler(res, "Invalid member id: " + req.params.id);
      }
    })
    .catch(error => {
      databaseErrorHandler(res, error);
    });
});

//UPDATE member
/** http://localhost:8777/api/member/    with method=PUT **/

member.put("/", function (req, res) {
  if (!req.body.id || !req.body.name) {
    requestErrorHandler(res, "Member id or name are missing!");
  } else {
    knex("Member")
      .where("id", req.body.id)
      .update(req.body)
      .then(rowsAffected => {
        if (rowsAffected === 1) {
          successHandler(res, rowsAffected, 
            "Update successful! Count of modified rows: " + rowsAffected)            
        } else {
          requestErrorHandler(res, "Invalid member for update, id: " + req.body.id)
        }
      })
      .catch(error => {
        if (error.errno == 1062) {
          requestErrorHandler(res, `DB 1062: Member with the name ${req.body.name} already exists!`);
        } else {
          databaseErrorHandler(res, error);
        }
      });
  } 
});

//GET Idea & Comments by member id

member.get("/idea/comment/:id", (req, res) => {
  let id = req.params.id;
  if( isNaN(req.params.id)) {
    requestErrorHandler(res, "Member id should be number and this is not: " + req.params.id);
  } else if(req.params.id < 1) {
    requestErrorHandler(res, "Member id should be >= 1 and this is not: " + req.params.id);
  } else {
  knex.select('commentTimeStamp', 'commentText', 'Idea.name')
    .from('Comment')
    .join('Idea', function () {
      this.on('Idea.id', '=', 'Comment.ideaId')
    })
    .where('Comment.memberId', id)
    .then(data => {
      if (data.length === 1) {
        successHandler(res, data);
      } else {
        requestErrorHandler(res, "Non-existing member id: " + req.params.id);
      }
    })
    .catch((error) => {
      databaseErrorHandler(res, error);
  });
  }
});

export default member;
