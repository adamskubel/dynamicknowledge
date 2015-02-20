define(function(require,exports,module){

    function Label(){}
    Label.State = function(){};

    function _initialize(id)
    {
        var model = gapi.drive.realtime.custom.getModel(this);

        if (id == undefined)
        {
            console.error("id required!");
            return null;
        }

        console.log("Initializing label with id '" + id+ "!");
        this.id = id;
        this.stateMap = model.createMap();
    }

    Label.registerGAPI = function()
    {
        //Register Label
        gapi.drive.realtime.custom.registerType(Label,'Label');

        gapi.drive.realtime.custom.setInitializer(Label, _initialize);

        Label.prototype.text = gapi.drive.realtime.custom.collaborativeField('text');
        Label.prototype.size = gapi.drive.realtime.custom.collaborativeField('size');
        Label.prototype.id = gapi.drive.realtime.custom.collaborativeField('id');
        Label.prototype.stateMap = gapi.drive.realtime.custom.collaborativeField('stateMap');

        //Register Label.State
        gapi.drive.realtime.custom.registerType(Label.State,'Label.State');

        Label.State.prototype.position = gapi.drive.realtime.custom.collaborativeField('position');
        Label.State.prototype.visible = gapi.drive.realtime.custom.collaborativeField('visible');
    };


    Label.create = function(model, id){
        return model.create(Label, id);
    };

    Label.prototype.createState = function(stateId)
    {
        if (this.stateMap.has(stateId))
        {
            return this.stateMap.get(stateId);
        }

        var model = gapi.drive.realtime.custom.getModel(this);
        var newState = model.create(Label.State);
        this.stateMap.set(stateId,newState);

        return newState;
    };

    Label.prototype.hasState = function(stateId)
    {
        return this.stateMap.has(stateId);
    };

    Label.prototype.getState = function(stateId)
    {
        return this.stateMap.get(stateId);
    };

    module.exports = Label;

});