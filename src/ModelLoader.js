define(function(require,exports,module){

    var DynamicObject = require('Model/DynamicObject');
    var AnnotationContainer = require('Model/AnnotationContainer');
    var AnnotationController = require('Controllers/AnnotationController');
    var Label = require('Model/Label');
    var DynamicObjectController = require('Controllers/DynamicObjectController');
    var LabelController = require('Controllers/LabelController');
    var Vector = require('ProperVector');
    var AccessInspector = require('Intrinsics/AccessInspector');

    function ModelLoader(_gapiModel, _objectRegistry){
        this.objectRegistry = _objectRegistry;
        this.gapiModel = _gapiModel;
    }

    var instance;

    ModelLoader.prototype.getModel = function(){
        return this.gapiModel;
    };

    ModelLoader.prototype.loadModel = function(topView)
    {
        if (!instance)
            instance = this;

        var top = this.gapiModel.getRoot().get("top");

        topView.setModel(top,this);

        console.log("Initialized model loader");
    };

    ModelLoader.registerModels = function(){
        Label.registerGAPI();
        AnnotationContainer.registerGAPI();
        DynamicObject.registerGAPI();
    };

    ModelLoader.prototype.getObject = function(objectId){

        var objects = this.gapiModel.getRoot().get("objects");

        if (!this.objectRegistry[objectId])
        {
            if (objects.has(objectId))
                this.objectRegistry[objectId] = _loadObject.call(this,objects.get(objectId));
            else
            {
                console.error("Object name '" + objectId + "' does not exist");
                return null;
            }
        }

        return this.objectRegistry[objectId];
    };

    ModelLoader.prototype.nextObjectId = function(prefix){
        var lastId = this.gapiModel.getRoot().get("lastId");
        this.gapiModel.getRoot().set("lastId",lastId+1);
        var id = "" + (lastId + 1);
        return prefix + "_" + id;
    };

    ModelLoader.prototype.addObject = function(name,object){

        var objects = this.gapiModel.getRoot().get("objects");
        if (objects.has(name))
        {
            console.error("Object '" + name + "' already exists!");
            return;
        }
        objects.set(name,object);
    };

    ModelLoader.prototype.getObjectDef = function(name){
        return this.gapiModel.getRoot().get("objects").get(name);
    };

    function _loadObject(objectDef)
    {
        var objectController;
        if (objectDef instanceof DynamicObject)
        {
            if (objectDef.type == "predef")
            {
                if (!objectDef.properties.has("predefinedName"))
                {
                    console.error("Predefined name is not defined for predef object '" + objectDef.id + "'");
                    return;
                }
                var pname = objectDef.properties.get("predefinedName");
                //var pos = objectDef.properties.get("position") || [0, 0, 0];

                var objectView = this.objectRegistry[pname];
                //objectView.setPosition(Vector.fromArray(objectView.position).add(Vector.fromArray(pos)).toArray());

                if (!objectView)
                {
                    console.error("Predefined object '" + pname + "' not found");
                    return;
                }
                objectController = new DynamicObjectController(objectDef, objectView, this);
            }

            else if (objectDef.type == "constructed")
            {
                var name = objectDef.properties.get("constructorName");
                switch (name)
                {
                    case "AccessInspector":
                        objectView = new AccessInspector();
                        objectController =  new DynamicObjectController(objectDef, objectView, this);
                        break;
                    default:
                        console.error("Unknown type '" + name + "'");
                }
            }
            else
            {
                console.error("Object type '" + objectDef.type + "' not supported");
                return;
            }
        }
        else if (objectDef instanceof Label)
        {
            console.log("Creating new label controller");
            objectController = new LabelController(objectDef);
        }


        return objectController;
    }

    module.exports = ModelLoader;

});