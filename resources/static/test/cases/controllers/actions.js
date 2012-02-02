/*jshint browsers:true, forin: true, laxbreak: true */
/*global test: true, start: true, stop: true, module: true, ok: true, equal: true, BrowserID:true */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
(function() {
  "use strict";

  var bid = BrowserID,
      user = bid.User,
      controller,
      el,
      testHelpers = bid.TestHelpers,
      register = testHelpers.register;

  function createController(config) {
    controller = BrowserID.Modules.Actions.create();
    controller.start(config);
  }

  module("controllers/actions", {
    setup: function() {
      testHelpers.setup();
    },

    teardown: function() {
      if(controller) {
        controller.destroy();
      }
      testHelpers.teardown();
    }
  });

  asyncTest("doError with no template - display default error screen", function() {
    createController({
      ready: function() {
        equal(testHelpers.errorVisible(), false, "Error is not yet visible");
        controller.doError({});
        ok(testHelpers.errorVisible(), "Error is visible");
        equal($("#defaultError").length, 1, "default error screen is shown");
        start();
      }
    });
  });

  asyncTest("doError with with template - display error screen", function() {
    createController({
      ready: function() {
        equal(testHelpers.errorVisible(), false, "Error is not yet visible");
        controller.doError("invalid_required_email", {email: "email"});
        equal($("#invalidRequiredEmail").length, 1, "default error screen is shown");
        ok(testHelpers.errorVisible(), "Error is visible");
        start();
      }
    });
  });

  asyncTest("doOffline - print offline error screen", function() {
    createController({
      ready: function() {
        controller.doOffline();
        ok($("#error .contents").text().length, "contents have been written");
        ok($("#error #offline").text().length, "offline error message has been written");
        start();
      }
    });
  });

  asyncTest("doProvisionPrimaryUser - start the provision_primary_user service", function() {
    createController({
      ready: function() {
        var error;
        try {
          controller.doProvisionPrimaryUser({email: "testuser@testuser.com"});
        } catch(e) {
          error = e;
        }

        equal(error, "module not registered for provision_primary_user", "correct service started");
        start();
      }
    });
  });

  asyncTest("doVerifyPrimaryUser - start the verify_primary_user service", function() {
    createController({
      ready: function() {
        var error;
        try {
          controller.doVerifyPrimaryUser();
        } catch(e) {
          error = e;
        }

        equal(error, "module not registered for verify_primary_user", "correct service started");
        start();
      }
    });
  });

  asyncTest("doPrimaryUserProvisioned - start the primary_user_verified service", function() {
    createController({
      ready: function() {
        var error;
        try {
          controller.doPrimaryUserProvisioned();
        } catch(e) {
          error = e;
        }

        equal(error, "module not registered for primary_user_provisioned", "correct service started");
        start();
      }
    });
  });

  asyncTest("doEmailChosen - start the email_chosen service", function() {
    createController({
      ready: function() {
        var error;
        try {
          controller.doEmailChosen({email: "testuser@testuser.com"});
        } catch(e) {
          error = e;
        }

        equal(error, "module not registered for email_chosen", "correct service started");
        start();
      }
    });
  });

  asyncTest("doConfirmSecondaryUser - start the check_registration service", function() {
    createController({
      ready: function() {
        var error;
        try {
          controller.doConfirmSecondaryUser({email: "testuser@testuser.com"});
        } catch(e) {
          error = e;
        }

        equal(error, "module not registered for check_registration", "correct service started");
        start();
      }
    });
  });

  asyncTest("doSetPassword - start the set_password service", function() {
    createController({
      ready: function() {
        var error;
        try {
          controller.doSetPassword({email: "testuser@testuser.com"});
        } catch(e) {
          error = e;
        }

        equal(error, "module not registered for set_password", "correct service started");
        start();
      }
    });
  });

  asyncTest("doConfirmEmail - start the check_registration service", function() {
    createController({
      ready: function() {
        var error;
        try {
          controller.doConfirmEmail({email: "testuser@testuser.com"});
        } catch(e) {
          error = e;
        }

        equal(error, "module not registered for check_registration", "correct service started");
        start();
      }
    });

  });

  asyncTest("doStageSecondaryUser - stages a secondary user", function() {
    createController({
      ready: function() {
        var error;

        register("user_staged", function(msg, info) {
          equal(info.email, "testuser@testuser.com", "correct email passed to user_staged");
          start();
        });

        controller.doStageSecondaryUser({email: "testuser@testuser.com"});
      }
    });

  });

  asyncTest("doEmailConfirmed - generate an assertion for the email", function() {
    createController({
      ready: function() {
        testHelpers.register("assertion_generated", function(msg, info) {
          ok(info.assertion, "assertion generated");
          start();
        });

        user.syncEmailKeypair("testuser@testuser.com", function() {
          controller.doEmailConfirmed({email: "testuser@testuser.com"});
        });
      }
    });
  });
}());

