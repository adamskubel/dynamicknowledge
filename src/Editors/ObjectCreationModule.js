define(function(require,exports,module)
{
    var DynamicObject = require('Model/DynamicObject');

    function ObjectCreationModule()
    {

    }

    ObjectCreationModule.prototype.createUI = function()
    {
        //Build list of createable objects
        //Create selector button
        //Add button to appropriate menu
    };

    function _addObject(objectName)
    {
        var model = gapi.drive.realtime.custom.getModel(this.objectDef);
        var objDef = DynamicObject.create(model,this.modelLoader.nextObjectId(objectName),'constructed');
        objDef.properties.set("constructorName","AccessInspector");

        this.modelLoader.addObject(objDef.id,objDef);

        this.objectDef.relationships.push(model.createString(objDef.id));
    }


    module.exports = ObjectCreationModule;
});