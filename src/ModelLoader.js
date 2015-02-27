define(function(require,exports,module){

    var DynamicObject = require('Model/DynamicObject');
    var AnnotationContainer = require('Model/AnnotationContainer');
    var AnnotationController = require('Controllers/AnnotationController');
    var Label = require('Model/Label');
    var DynamicObjectController = require('Controllers/DynamicObjectController');
    var LabelController = require('Controllers/LabelController');
    var Vector = require('ProperVector');

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

        //this.topView = topView;

        var top = this.gapiModel.getRoot().get("top");

        topView.setModel(top,this);

        console.log("Initialized model loader");
    };

    ModelLoader.registerModels = function(){
        Label.registerGAPI();
        AnnotationContainer.registerGAPI();
        DynamicObject.registerGAPI();
    };

    ModelLoader.prototype.getObject = function(name){

        var objects = this.gapiModel.getRoot().get("objects");

        if (!this.objectRegistry[name])
        {
            if (objects.has(name))
                this.objectRegistry[name] = _loadObject.call(this,objects.get(name));
            else
            {
                console.error("Object name '" + name + "' does not exist");
                return null;
            }
        }

        return this.objectRegistry[name];
    };

    ModelLoader.prototype.nextObjectId = function(){
        var lastId = this.gapiModel.getRoot().get("lastId");
        this.gapiModel.getRoot().set("lastId",lastId+1);
        var id = "" + (lastId + 1);
        return id;
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
                    console.error("Predefined name is not defined for predef object '" +objectDef.id + "'");
                    return;
                }
                var pname = objectDef.properties.get("predefinedName");
                var pos = objectDef.properties.get("position") || [0,0,0];

                var objectView = this.objectRegistry[pname];
                objectView.setPosition(Vector.fromArray(objectView.position).add(Vector.fromArray(pos)).toArray());

                if (!objectView)
                {
                    console.error("Predefined object '" + pname + "' not found");
                    return;
                }
                objectController = new DynamicObjectController(objectDef,objectView);
            }
            else
            {
                console.error("Cannot load non-predefined dynamic objects");
                return;
            }
            _loadRelationships.call(this,objectController,objectDef.relationships);

        }
        else if (objectDef instanceof Label)
        {
            console.log("Creating new label controller");
            objectController = new LabelController(objectDef);
        }

        return objectController;
    }

    function _loadRelationships(objectController,relationships)
    {
        var r = relationships.asArray();
        for (var i=0;i < r.length;i++)
        {
            var relationship = r[i];

            if (relationship instanceof AnnotationContainer)
            {
                var ac = new AnnotationController(relationship,this);

                objectController.addController(ac);
            }
            else if (relationship.type == "List")
            {
                for (var x=0;x<relationship.length;x++)
                {
                    var child = relationship.get(x);
                    objectController.addController(this.getObject(child));
                }
            }
        }
    }



    module.exports = ModelLoader;

});