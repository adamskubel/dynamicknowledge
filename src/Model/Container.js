define(function(require,exports,module){

    function Container(){

    };

    Container.State = function(){

    };


    function _initialize(id)
    {
        if (id == undefined)
        {
            console.error("id required!");
            return null;
        }

        var model = gapi.drive.realtime.custom.getModel(this);
        this.id = id;
        this.stateMap = model.createMap();
    }

    function _initializeState()
    {
        var model = gapi.drive.realtime.custom.getModel(this);
        this.children = model.createList();
    }

    function _onLoaded()
    {
        console.log("Loaded Container with id = " + this.id + " and states: " + this.stateMap.keys());
    }

    Container.registerGAPI = function()
    {
        //Register Container
        gapi.drive.realtime.custom.registerType(Container,'Container');

        gapi.drive.realtime.custom.setInitializer(Container, _initialize);
        //gapi.drive.realtime.custom.setOnLoaded(Container, _onLoaded);

        Container.prototype.id = gapi.drive.realtime.custom.collaborativeField('id');
        Container.prototype.stateMap = gapi.drive.realtime.custom.collaborativeField('stateMap');

        //Register Container.State
        gapi.drive.realtime.custom.registerType(Container.State,'Container.State');
        gapi.drive.realtime.custom.setInitializer(Container.State, _initializeState);
        Container.State.prototype.children = gapi.drive.realtime.custom.collaborativeField('children');
    };

    Container.create = function(model, id){
        return model.create(Container, id);
    };


    Container.prototype.createState = function(stateId)
    {
        if (this.stateMap.has(stateId))
        {
            return this.stateMap.get(stateId);
        }

        var model = gapi.drive.realtime.custom.getModel(this);
        var newState = model.create(Container.State);
        this.stateMap.set(stateId,newState);

        return newState;
    };

    Container.prototype.getState = function(stateId){
        return this.stateMap.get(stateId);
    };




    module.exports = Container;

});