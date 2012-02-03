/*jshint browser:true, jQuery: true, forin: true, laxbreak:true */
/*global BrowserID: true */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
BrowserID.State = (function() {
  var bid = BrowserID,
      storage = bid.Storage,
      mediator = bid.Mediator,
      publish = mediator.publish.bind(mediator),
      user = bid.User,
      moduleManager = bid.module,
      controller,
      addPrimaryUser = false,
      email,
      requiredEmail;

  function startStateMachine() {
    var self = this,
        subscribe = self.subscribe.bind(self),
        startState = function(save, msg, options) {
          if(typeof save !== "boolean") {
            options = msg;
            msg = save;
            save = true;
          }

          var func = controller[msg].bind(controller);
          self.gotoState(save, func, options);
        }
        cancelState = self.popState.bind(self);

    subscribe("offline", function(msg, info) {
      startState("doOffline");
    });

    subscribe("start", function(msg, info) {
      info = info || {};

      self.hostname = info.hostname;
      self.allowPersistent = !!info.allowPersistent;
      requiredEmail = info.requiredEmail;

      if ((typeof(requiredEmail) !== "undefined")
       && (!bid.verifyEmail(requiredEmail))) {
        // Invalid format
        startState("doError", "invalid_required_email", {email: requiredEmail});
      }
      else {
        startState("doCheckAuth");
      }
    });

    subscribe("cancel", function() {
      startState("doCancel");
    });

    subscribe("window_unload", function() {
      if (!self.success) {
        //storage.setStagedOnBehalfOf("");
        if(self.stagedEmail) {
          localStorage.redirectTo = user.getOrigin();
        }
        startState("doCancel");
      }
    });

    subscribe("authentication_checked", function(msg, info) {
      var authenticated = info.authenticated;

      if (requiredEmail) {
        startState("doAuthenticateWithRequiredEmail", {
          email: requiredEmail
        });
      }
      else if (authenticated) {
        publish("pick_email");
      } else {
        publish("authenticate");
      }
    });

    subscribe("authenticate", function(msg, info) {
      startState("doAuthenticate", info);
    });

    subscribe("user_staged", function(msg, info) {
      self.stagedEmail = info.email;
      info.required = !!requiredEmail;
      startState("doConfirmUser", info);
    });

    subscribe("user_confirmed", function() {
      var email = self.stagedEmail;
      self.stagedEmail = null;
      startState("doEmailConfirmed", { email: email} );
    });

    subscribe("primary_user", function(msg, info) {
      addPrimaryUser = !!info.add;
      email = info.email;

      var idInfo = storage.getEmail(email);
      if(idInfo && idInfo.cert) {
        publish("primary_user_ready", info);
      }
      else {
        // We don't want to put the provisioning step on the stack, instead when
        // a user cancels this step, they should go back to the step before the
        // provisioning.
        startState(false, "doProvisionPrimaryUser", info);
      }
    });

    subscribe("primary_user_provisioned", function(msg, info) {
      info = info || {};
      info.add = !!addPrimaryUser;
      startState("doPrimaryUserProvisioned", info);
    });

    subscribe("primary_user_unauthenticated", function(msg, info) {
      info = info || {};
      info.add = !!addPrimaryUser;
      info.email = email;
      info.requiredEmail = !!requiredEmail;
      startState("doVerifyPrimaryUser", info);
    });

    subscribe("primary_user_authenticating", function(msg, info) {
      // Keep the dialog from automatically closing when the user browses to
      // the IdP for verification.
      moduleManager.stopAll();
      self.success = true;
    });

    subscribe("primary_user_ready", function(msg, info) {
      startState("doEmailChosen", info);
    });

    subscribe("pick_email", function() {
      startState("doPickEmail", {
        origin: self.hostname,
        allow_persistent: self.allowPersistent
      });
    });

    subscribe("email_chosen", function(msg, info) {
      var email = info.email
          idInfo = storage.getEmail(email);

      function complete() {
        info.complete && info.complete();
      }

      if(idInfo) {
        if(idInfo.type === "primary") {
          if(idInfo.cert) {
            startState("doEmailChosen", info);
          }
          else {
            // If the email is a primary, and their cert is not available,
            // throw the user down the primary flow.
            // Doing so will catch cases where the primary certificate is expired
            // and the user must re-verify with their IdP.  This flow will
            // generate its own assertion when ready.
            publish("primary_user", info);
          }
        }
        else {
          user.checkAuthentication(function(authentication) {
            if(authentication === "assertion") {
              // user not authenticated, kick them over to the required email
              // screen.
              startState("doAuthenticateWithRequiredEmail", {
                email: email,
                secondary_auth: true
              });
            }
            else {
              startState("doEmailChosen", info);
            }
            complete();
          }, complete);
        }
      }
      else {
        throw "invalid email";
      }
    });

    subscribe("notme", function() {
      startState("doNotMe");
    });

    subscribe("logged_out", function() {
      publish("authenticate");
    });

    subscribe("authenticated", function(msg, info) {
      publish("pick_email");
    });

    subscribe("forgot_password", function(msg, info) {
      // forgot password initiates the forgotten password flow.
      startState(false, "doForgotPassword", info);
    });

    subscribe("reset_password", function(msg, info) {
      // reset password says the password has been reset, now waiting for
      // confirmation.
      startState(false, "doResetPassword", info);
    });

    subscribe("assertion_generated", function(msg, info) {
      self.success = true;
      if (info.assertion !== null) {
        storage.setStagedOnBehalfOf("");
        startState("doAssertionGenerated", info);
      }
      else {
        startState("doPickEmail");
      }
    });

    subscribe("add_email", function(msg, info) {
      startState("doAddEmail");
    });

    subscribe("email_staged", function(msg, info) {
      self.stagedEmail = info.email;
      info.required = !!requiredEmail;
      startState("doConfirmEmail", info);
    });

    subscribe("email_confirmed", function() {
<<<<<<< HEAD
      var email = self.stagedEmail;
      self.stagedEmail = null;
      startState("doEmailConfirmed", { email: email });
=======
      startState("doEmailConfirmed", { email: self.stagedEmail} );
>>>>>>> Show a "cancel" link instead of "and use another email" in wait for verification screen for required email.
    });

    subscribe("cancel_state", function(msg, info) {
      cancelState(info);
    });

  }

  var State = BrowserID.StateMachine.extend({
    start: function(options) {
      options = options || {};

      controller = options.controller;
      if (!controller) {
        throw "start: controller must be specified";
      }

      addPrimaryUser = false;
      email = requiredEmail = null;
<<<<<<< HEAD
=======

>>>>>>> Show a "cancel" link instead of "and use another email" in wait for verification screen for required email.
      State.sc.start.call(this, options);
      startStateMachine.call(this);
    }
  });

  return State;
}());

