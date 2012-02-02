/*jshint browser:true, jQuery: true, forin: true, laxbreak:true */
/*global BrowserID:true, PageController: true */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
BrowserID.Modules.Authenticate = (function() {
  "use strict";

  var ANIMATION_TIME = 250,
      bid = BrowserID,
      user = bid.User,
      errors = bid.Errors,
      validation = bid.Validation,
      tooltip = bid.Tooltip,
      helpers = bid.Helpers,
      dialogHelpers = helpers.Dialog,
      cancelEvent = helpers.cancelEvent,
      complete = helpers.complete,
      dom = bid.DOM,
      lastEmail = "",
      addressInfo;

  function getEmail() {
    return helpers.getAndValidateEmail("#email");
  }

  function initialState(info) {
    var self=this;

    self.submit = checkEmail;
    if(info && info.email && info.type === "secondary" && info.known) {
      enterPasswordState.call(self, info.ready);
    }
    else {
      animateSwap(".newuser,.forgot,.returning", ".start");
      complete(info.ready);
    }
  }

  function checkEmail(info) {
    var email = getEmail(),
        self = this;

    if (!email) return;

    if(info && info.type) {
      onAddressInfo(info);
    }
    else {
      user.addressInfo(email, onAddressInfo,
        self.getErrorDialog(errors.addressInfo));
    }

    function onAddressInfo(info) {
      addressInfo = info;

      if(info.type === "primary") {
        self.close("primary_user", info, info);
      }
      else if(info.known) {
        enterPasswordState.call(self);
      } else {
        self.close("new_user", {email: email});
        //createSecondaryUserState.call(self);
      }
    }
  }

  function createSecondaryUser(callback) {
    var self=this,
        email = getEmail();

    if (email) {
      self.close("new_user", {email: email});
      //dialogHelpers.createUser.call(self, email, callback);
    } else {
      callback && callback();
    }
  }

  function authenticate() {
    var email = getEmail(),
        pass = helpers.getAndValidatePassword("#password"),
        self = this;

    if (email && pass) {
      dialogHelpers.authenticateUser.call(self, email, pass, function(authenticated) {
        if (authenticated) {
          self.close("authenticated", {
            email: email
          });
        }
      });
    }
  }

  function animateSwap(fadeOutSelector, fadeInSelector, callback) {
    // XXX instead of using jQuery here, think about using CSS animations.
    $(fadeOutSelector).hide();
    $(fadeInSelector).fadeIn(ANIMATION_TIME, callback);
  }

  function enterEmailState(el) {
    if (!$("#email").is(":disabled")) {
      this.submit = checkEmail;
      animateSwap(".returning:visible,.newuser:visible", ".start");
    }
  }

  function enterPasswordState(callback) {
    var self=this;

    self.publish("enter_password", addressInfo);
    self.submit = authenticate;
    animateSwap(".start:visible,.newuser:visible,.forgot:visible", ".returning", function() {
      dom.focus("#password");
    });
    complete(callback);
  }

  function forgotPassword() {
    var email = getEmail();
    if (email) {
      var info = addressInfo || { email: email };
      this.close("forgot_password", info, info );
    }
  }

  function createSecondaryUserState() {
    var self=this;

    self.publish("create_user");
    self.submit = createSecondaryUser;
    animateSwap(".start:visible,.returning:visible", ".newuser");
  }


  function emailKeyUp() {
    var newEmail = dom.getInner("#email");
    if (newEmail !== lastEmail) {
      lastEmail = newEmail;
      enterEmailState.call(this);
    }
  }

  var Module = bid.Modules.PageModule.extend({
    start: function(options) {
      options = options || {};

      addressInfo = null;
      lastEmail = options.email || "";

      var self=this;
      self.renderDialog("authenticate", {
        sitename: user.getHostname(),
        email: lastEmail
      });

      $(".newuser,.forgot,.returning,.start").hide();

      self.bind("#email", "keyup", emailKeyUp);
      self.bind("#forgotPassword", "click", cancelEvent(forgotPassword));

      Module.sc.start.call(self, options);
      initialState.call(self, options);
    }

    // BEGIN TESTING API
    ,
    checkEmail: checkEmail,
    createUser: createSecondaryUser,
    authenticate: authenticate,
    forgotPassword: forgotPassword
    // END TESTING API
  });

  return Module;

}());
