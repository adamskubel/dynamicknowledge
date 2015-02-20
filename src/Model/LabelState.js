define(function(require,exports,module){

    function LabelState(){

    }


    function _initialize(id)
    {
        //var model = gapi.drive.realtime.custom.getModel(this);

        //console.log("Initializing label with id '" + id+ "!");
        //this.id = id;
    }

    LabelState.registerGAPIModel = function()
    {
        gapi.drive.realtime.custom.registerType(LabelState,'LabelState');
        gapi.drive.realtime.custom.setInitializer(LabelState, _initialize);

        LabelState.prototype.position = gapi.drive.realtime.custom.collaborativeField('position');
        LabelState.prototype.visible = gapi.drive.realtime.custom.collaborativeField('visible');
        //LabelState.prototype.id = gapi.drive.realtime.custom.collaborativeField('id');

        console.log('Registered labelState type with GAPI');
    };

    LabelState.create = function(model, id){
        //if (id == undefined)
        //{
        //    console.error("id required!");
        //    return null;
        //}
        return model.create(LabelState);
    };

    module.exports = LabelState;

});