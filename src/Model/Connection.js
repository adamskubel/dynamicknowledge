define(function(require,exports,module){

    function Connection()
    {
        
    }

    function _initialize(id, type)
    {
        if (id == undefined)
        {
            console.error("id required!");
            return null;
        }

        var model = gapi.drive.realtime.custom.getModel(this);
        this.id = id;
        this.stateMap = model.createMap();
        this.properties = model.createMap();
        this.type = type;
    }

    Connection.registerGAPI = function()
    {
        //Register Connection
        gapi.drive.realtime.custom.registerType(Connection,'Connection');
        gapi.drive.realtime.custom.setInitializer(Connection, _initialize);

        Connection.prototype.id = gapi.drive.realtime.custom.collaborativeField('id');
        Connection.prototype.type = gapi.drive.realtime.custom.collaborativeField('type');

        Connection.prototype.from = gapi.drive.realtime.custom.collaborativeField('from');
        Connection.prototype.to = gapi.drive.realtime.custom.collaborativeField('to');

        Connection.prototype.properties = gapi.drive.realtime.custom.collaborativeField('properties');

        Connection.prototype.stateMap = gapi.drive.realtime.custom.collaborativeField('stateMap');
    };

    Connection.create = function(model, id, type){
        if (model.nextObjectId && model.getModel)
        {
            var m = model.getModel();
            return m.create(Connection, model.nextObjectId(type),type);
        }
        else
        {
            return model.create(Connection, id, type);
        }
    };

    Connection.prototype.hasState = function(stateId)
    {
        return this.stateMap.has(stateId);
    };

    Connection.prototype.getState = function(stateId){
        return this.stateMap.get(stateId);
    };

    module.exports = Connection;
});
