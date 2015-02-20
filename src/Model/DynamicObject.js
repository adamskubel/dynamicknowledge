define(function(require,exports,module){

    function DynamicObject(){

    }

    DynamicObject.State = function(){

    };


    function _initialize(id,type)
    {
        if (id == undefined || type == undefined)
        {
            console.error("id and type required!");
            return null;
        }

        var model = gapi.drive.realtime.custom.getModel(this);
        this.id = id;
        this.type = type;
        this.stateMap = model.createMap();
    }

    function _initializeState()
    {
        var model = gapi.drive.realtime.custom.getModel(this);
    }

    DynamicObject.registerGAPIModel = function()
    {
        //Register DynamicObject
        gapi.drive.realtime.custom.registerType(DynamicObject,'DynamicObject');
        gapi.drive.realtime.custom.setInitializer(DynamicObject, _initialize);

        DynamicObject.prototype.id = gapi.drive.realtime.custom.collaborativeField('id');
        DynamicObject.prototype.type = gapi.drive.realtime.custom.collaborativeField('type');
        DynamicObject.prototype.stateMap = gapi.drive.realtime.custom.collaborativeField('stateMap');

        //Register DynamicObject.State
        gapi.drive.realtime.custom.registerType(DynamicObject.State,'DynamicObject.State');
        gapi.drive.realtime.custom.setInitializer(DynamicObject, _initializeState);
        DynamicObject.State.prototype.visible = gapi.drive.realtime.custom.collaborativeField('visible');
    };

    DynamicObject.create = function(model, id, type){
        return model.create(DynamicObject, id, type);
    };

    DynamicObject.prototype.createState = function(stateId)
    {
        if (this.stateMap.has(stateId))
        {
            return this.stateMap.get(stateId);
        }

        var model = gapi.drive.realtime.custom.getModel(this);
        var newState = model.create(DynamicObject.State);
        this.stateMap.set(stateId,newState);

        return newState;
    };

    DynamicObject.prototype.getState = function(stateId){
        return this.stateMap.get(stateId);
    };

    module.exports = DynamicObject;
});