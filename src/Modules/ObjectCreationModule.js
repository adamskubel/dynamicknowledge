define(function(require,exports,module){

    function ObjectCreationModule()
    {

    }

    ObjectCreationModule.prototype.createUI = function()
    {
        //Build list of createable objects
        //Create selector button
        //Add button to appropriate menu
    };

    function _addObject()
    {
        var model = gapi.drive.realtime.custom.getModel(this.objectDef);
        var objDef = DynamicObject.create(model,this.modelLoader.nextObjectId('AccessInspector'),'constructed');
        objDef.properties.set("constructorName","AccessInspector");

        this.modelLoader.addObject(objDef.id,objDef);

        this.objectDef.relationships.push(model.createString(objDef.id));
    }


    module.exports = ObjectCreationModule;
});