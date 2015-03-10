define(function(require,exports,module){

    var DynamicObject = require('Model/DynamicObject');
    var DynamicObjectController = require('Controllers/DynamicObjectController');
    var LabelController = require('Controllers/LabelController');
    var AccessInspector = require('Intrinsics/AccessInspector');
    var Connection = require('Model/Connection');
    var Container = require('Model/Container');
    var DynamicContainerController = require('Controllers/DynamicContainerController');
    var LineCanvas = require('LineCanvas');
    var Utils = require('Utils');
    var SideBarController = require('Controllers/SideBarController');
    var SideBarLabelController = require('Controllers/SideBarLabelController');

    function ModelLoader(_gapiModel, _objectRegistry){
        this.objectRegistry = _objectRegistry;
        this.gapiModel = _gapiModel;
        DynamicKnowledge.ModelLoader = this;
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

    ModelLoader.registerModels = function()
    {
        Container.registerGAPI();
        DynamicObject.registerGAPI();
        Connection.registerGAPI();
    };

    ModelLoader.prototype.getObject = function(objectId){

        var objects = this.gapiModel.getRoot().get("objects");

        if (!this.objectRegistry[objectId])
        {
            if (objects.has(objectId))
                this.objectRegistry[objectId] = _loadObject.call(this,objects.get(objectId));
            else
            {
                throw { error: "Object name '" + objectId + "' does not exist"}
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
                objectController = new DynamicObjectController(objectDef, this, objectView);
            }

            else if (objectDef.type == "constructed")
            {
                var name = objectDef.properties.get("constructorName");
                switch (name)
                {
                    case "AccessInspector":
                        objectView = new AccessInspector();
                        objectController =  new DynamicObjectController(objectDef, this, objectView);
                        break;
                    default:
                        console.error("Unknown type '" + name + "'");
                }
            }
            //Object already exists in model, just make the controller
            else if (objectDef.type == "generated")
            {
                ;
            }
            else if (objectDef.type == "container")
            {
                objectController = new DynamicContainerController(objectDef,this);
            }
            else if (objectDef.type == "label")
            {
                objectController = new LabelController(objectDef,this);
            }
            else if (objectDef.type == "sidebar")
            {
                objectController = new SideBarController(objectDef);
            }
            else if (objectDef.type == "sidebar_label")
            {
                objectController = new SideBarLabelController(objectDef);
            }
            else
            {
                console.error("Object type '" + objectDef.type + "' not supported");
                return;
            }
        }

        DynamicKnowledge.EditManager.registerController(objectController);

        return objectController;
    }


    ModelLoader.prototype.makeRelationship = function(controller, relationship)
    {
        if (relationship instanceof Connection)
        {
            //console.debug("Adding connection relationship of type '" + relationship.type + "' : '" + relationship.from + "' -> '" + relationship.to + "'");
            if (relationship.type == "container")
            {
                var container = this.getObject(relationship.to);

                controller.addController(container);
                if (!controller.getView())
                    console.error("Controller must have a view");

                Utils.injectView(container.getView(),controller.getView());
                DynamicKnowledge.EditManager.registerController(container);
            }
            else if (relationship.type == "line")
            {
                var fromView = this.getObject(relationship.from).objectView;
                var toView = this.getObject(relationship.to).objectView;

                var output = fromView.getOutputEvents()[relationship.type];
                var input = toView.getInputEvents()[relationship.type];

                if (output && input)
                {
                    fromView.pipe(toView);

                    var connectionLine = new LineCanvas();
                    connectionLine.parent = controller.getView();
                    controller.getView().add(connectionLine.getModifier()).add(connectionLine.getRenderController());

                    console.log("Binding to " + input._globalId);
                    output.parent.on('positionChange', function ()
                    {
                        output._eventOutput.emit('positionChange');
                    });

                    input.parent.on('positionChange', function ()
                    {
                        input._eventOutput.emit('positionChange');
                    });

                    connectionLine.setLineObjects(output, input);
                }
                else
                {
                    console.error("Can't find event type '" + relationship.type + "' on views");
                }
            }
        }
        else if (relationship.type == "List")
        {
            for (var x=0;x<relationship.length;x++)
            {
                var child = relationship.get(x);
                controller.addController(this.getObject(child));
            }
        }
        else if (relationship.type == "EditableString")
        {
            controller.addController(this.getObject(relationship.toString()));
        }
    };

    module.exports = ModelLoader;

});