define(function(require,exports,module){

    function Label(){

    }


    function _initialize(opt_text)
    {
        console.log("Initializing label with text '" + opt_text+ "!");

        if (opt_text)
        {
            this.text = opt_text;
        }
    }

    Label.registerGAPIModel = function()
    {
        gapi.drive.realtime.custom.registerType(Label,'Label');

        gapi.drive.realtime.custom.setInitializer(Label, _initialize);

        Label.prototype.position = gapi.drive.realtime.custom.collaborativeField('position');
        Label.prototype.text = gapi.drive.realtime.custom.collaborativeField('text');
        Label.prototype.size = gapi.drive.realtime.custom.collaborativeField('size');

        console.log('Registered label type with GAPI');
    };

    Label.create = function(model, text){
        return model.create(Label, text);
    };




    module.exports = Label;

});