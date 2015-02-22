define(function(require,exports,module)
{

    function GAPIAuthenticator(){

    }


    GAPIAuthenticator.prototype.connect = function(onAuthComplete){
        _auth.call(this,onAuthComplete);
    };

    function _fetchUserId(callback)
    {
        var _this = this;
        gapi.client.load('oauth2', 'v2', function ()
        {
            gapi.client.oauth2.userinfo.get().execute(function (resp)
            {
                if (resp.id)
                {
                    _this.userId = resp.id;
                }

                if (callback)
                {
                    callback();
                }
            });
        });
    }



    function _auth(onAuthComplete)
    {

        var rtclient = rtclient || {};

        rtclient.INSTALL_SCOPE = 'https://www.googleapis.com/auth/drive.install';
        rtclient.FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
        rtclient.OPENID_SCOPE = 'openid';
        rtclient.REALTIME_MIMETYPE = 'application/vnd.google-apps.drive-sdk';


        var clientId = '645480454740-n8ui9o5v4tieo3s0utqvhta6k8gakcrt.apps.googleusercontent.com';

        var userId = null;
        var _this = this;

        var handleAuthResult = function (authResult)
        {
            if (authResult && !authResult.error)
            {
                //_this.authButton.setClickable(false);

                _fetchUserId(onAuthComplete);
                console.log('yay!');
            } else
            {
                authorizeWithPopup();
            }
        };

        var authorizeWithPopup = function ()
        {
            gapi.auth.authorize({
                client_id: clientId,
                scope: [
                    rtclient.INSTALL_SCOPE,
                    rtclient.FILE_SCOPE,
                    rtclient.OPENID_SCOPE
                ],
                user_id: userId,
                immediate: false
            }, handleAuthResult);
            console.log(clientId);
        };

        // Try with no popups first.
        gapi.auth.authorize({
            client_id: clientId,
            scope: [
                rtclient.INSTALL_SCOPE,
                rtclient.FILE_SCOPE,
                rtclient.OPENID_SCOPE
            ],
            user_id: userId,
            immediate: true
        }, handleAuthResult);
    }

    module.exports = GAPIAuthenticator;
});