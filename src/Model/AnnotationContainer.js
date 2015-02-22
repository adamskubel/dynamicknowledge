define(function(require,exports,module){

    function AnnotationContainer(){

    };

    AnnotationContainer.State = function(){

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
        console.log("Loaded AnnotationContainer with id = " + this.id + " and states: " + this.stateMap.keys());
    }

    AnnotationContainer.registerGAPI = function()
    {
        //Register AnnotationContainer
        gapi.drive.realtime.custom.registerType(AnnotationContainer,'AnnotationContainer');

        gapi.drive.realtime.custom.setInitializer(AnnotationContainer, _initialize);
        //gapi.drive.realtime.custom.setOnLoaded(AnnotationContainer, _onLoaded);

        AnnotationContainer.prototype.id = gapi.drive.realtime.custom.collaborativeField('id');
        AnnotationContainer.prototype.stateMap = gapi.drive.realtime.custom.collaborativeField('stateMap');

        //Register AnnotationContainer.State
        gapi.drive.realtime.custom.registerType(AnnotationContainer.State,'AnnotationContainer.State');
        gapi.drive.realtime.custom.setInitializer(AnnotationContainer.State, _initializeState);
        AnnotationContainer.State.prototype.children = gapi.drive.realtime.custom.collaborativeField('children');
    };

    AnnotationContainer.create = function(model, id){
        return model.create(AnnotationContainer, id);
    };


    AnnotationContainer.prototype.createState = function(stateId)
    {
        if (this.stateMap.has(stateId))
        {
            return this.stateMap.get(stateId);
        }

        var model = gapi.drive.realtime.custom.getModel(this);
        var newState = model.create(AnnotationContainer.State);
        this.stateMap.set(stateId,newState);

        return newState;
    };

    AnnotationContainer.prototype.getState = function(stateId){
        return this.stateMap.get(stateId);
    };




    module.exports = AnnotationContainer;

});