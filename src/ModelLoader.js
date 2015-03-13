define(function(require,exports,module){

    var DynamicObject = require('Model/DynamicObject');
    var DynamicObjectController = require('Controllers/DynamicObjectController');
    var LabelController = require('Controllers/LabelController');
    var AccessInspector = require('Intrinsics/AccessInspector');
    var Connection = require('Model/Connection');
    var Container = require('Model/Container');
    var DynamicContainerController = require('Controllers/DynamicContainerController');
    var LineCanvas = require('Views/LineCanvas');
    var Utils = require('Utils');
    var SideBarController = require('Controllers/SideBarController');
    var SideBarLabelController = require('Controllers/SideBarLabelController');
    var LineController = require('Controllers/LineController');

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
                throw "Object name '" + objectId + "' does not exist";
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

    ModelLoader.prototype.registerController = function(id,controller){
        this.objectRegistry[id] = controller;
    };

    function _loadObject(objectDef)
    {
        var objectController;
        if (objectDef instanceof DynamicObject)
        {
            switch (objectDef.type)
            {
                case DynamicObject.Types.Predefined:
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
                    objectController = new DynamicObjectController({objectDef:objectDef, view:objectView});
                    break;
                case "constructed":
                    var name = objectDef.properties.get("constructorName");
                    switch (name)
                    {
                        case "AccessInspector":
                            objectView = new AccessInspector();
                            objectController = new DynamicObjectController({objectDef:objectDef, view:objectView});
                            break;
                        default:
                            console.error("Unknown type '" + name + "'");
                    }
                    break;
                case "generated":
                    //Object already exists in model and controller was already created, so we shouldn't be here.
                    throw "Controller was not found for generated object '" + objectDef.id + "'";
                case "container":
                    objectController = new DynamicContainerController({objectDef:objectDef});
                    break;
                case "label":
                    objectController = new LabelController({objectDef:objectDef});
                    break;
                case "sidebar":
                    objectController = new SideBarController({objectDef:objectDef});
                    break;
                case "sidebar_label":
                    objectController = new SideBarLabelController({objectDef:objectDef});
                    break;
                case DynamicObject.Types.ConnectingLine:
                    objectController = new LineController({objectDef:objectDef});
                    break;
                default:
                    throw "Object type '" + objectDef.type + "' not supported";

            }
        }

        if (!objectController)
        {
            throw "Could not create controller for object '" + objectDef.id + "'";
        }

        DynamicKnowledge.EditManager.registerController(objectController);

        return objectController;
    }


    ModelLoader.prototype.makeRelationship = function(controller, relationship)
    {
        if (relationship instanceof Connection)
        {
            console.debug("Adding connection relationship of type '" + relationship.type + "' : '" + relationship.from + "' -> '" + relationship.to + "'");
            switch (relationship.type)
            {
                case Connection.Types.Container:
                    var container = this.getObject(relationship.to);

                    controller.addController(container);
                    if (!controller.getView())
                        console.error("Controller must have a view");

                    Utils.injectView(container.getView(),controller.getView());
                    DynamicKnowledge.EditManager.registerController(container);
                    break;
                case "Line":
                    var fromView = this.getObject(relationship.from).objectView;
                    var toView = this.getObject(relationship.to).objectView;
                    var eventType = relationship.properties.get("eventType");

                    var output = fromView.getOutputEvents()[eventType];
                    var input = toView.getInputEvents()[eventType];

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
                    break;
                case Connection.Types.StateTrigger:
                    var targetController = this.getObject(relationship.to);
                    var targetState = relationship.properties.get("targetState");
                    controller.addStateTrigger(targetController,targetState);
                    break;
                case Connection.Types.LineVertex:
                    //Skip because controller handles it
                    break;
                default:
                    console.error("Unknown connection type '" + relationship.type + "'")
                    break;
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