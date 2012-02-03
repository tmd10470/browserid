/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(function() {
  var bid = BrowserID,
      moduleManager = bid.module,
      modules = bid.Modules,
      network = bid.Network,
      xhr = bid.XHR;


  // A request that takes more than 10 seconds is considered delayed.
  xhr.init({ time_until_delay: 10 * 1000 });
  network.init();

  moduleManager.register("cookie_check", modules.CookieCheck);
  moduleManager.start("cookie_check", {
    ready: function(status) {
      if(!status) return;

      moduleManager.register("code_check", modules.CodeCheck);
      moduleManager.start("code_check", {
        file_name_prefix: "dialog",
        code_ver: "__BROWSERID_CODE_VERSION__",
        ready: function(status) {
          // if status is false, that means the javascript is out of date and we
          // have to reload.
          if(status) {
            moduleManager.register("dialog", modules.Dialog);
            moduleManager.register("add_email", modules.AddEmail);
            moduleManager.register("authenticate", modules.Authenticate);
            moduleManager.register("check_registration", modules.CheckRegistration);
            moduleManager.register("forgot_password", modules.ForgotPassword);
            moduleManager.register("pick_email", modules.PickEmail);
            moduleManager.register("required_email", modules.RequiredEmail);
            moduleManager.register("verify_primary_user", modules.VerifyPrimaryUser);
            moduleManager.register("provision_primary_user", modules.ProvisionPrimaryUser);
            moduleManager.register("primary_user_provisioned", modules.PrimaryUserProvisioned);
            moduleManager.register("email_chosen", modules.EmailChosen);
            moduleManager.register("xhr_delay", modules.XHRDelay);
            moduleManager.register("xhr_disable_form", modules.XHRDisableForm);
            moduleManager.register("convert_account", modules.ConvertAccount);


            moduleManager.start("xhr_delay");
            moduleManager.start("xhr_disable_form");
            moduleManager.start("dialog");
            moduleManager.start("convert_account");
          }
        }
      });
    }
  });
}());

