define(function(require,exports,module){

	var DynamicContainer = require('PositioningLayouts/DynamicContainer');
	var BoxView = require('PositioningLayouts/BoxView');

    var Colors = require('Colors');
    var Transform = require('famous/core/Transform');
    var Modifier = require('famous/core/Modifier');

	var EditorFactory = require('Editors/EditorFactory');
	var DynamicObject = require('Model/DynamicObject');
    var Surface = require('famous/core/Surface');
	var Utils = require('Utils');

    var AbstractObjectController = require('./AbstractObjectController');
    var Connection = require('Model/Connection');

    var MenuBar = require('Views/MenuBar');
    var ListSelector = require('Views/ListSelector');

	function DynamicObjectController(objectDef, modelLoader, objectView)
	{
        this.objectView = objectView;
        this.objectView.modelId = objectDef.id;

        AbstractObjectController.call(this,objectDef,modelLoader);

        if (objectView.setController)
            objectView.setController(this);

        var pmap = Utils.getPropertyMap(objectDef.properties);
        objectView.applyProperties(pmap);
        objectView.applyProperties(Utils.getPropertyMap(objectDef.getState(this.state).properties));
	}

    DynamicObjectController.prototype = Object.create(AbstractObjectController.prototype);
    DynamicObjectController.prototype.constructor = DynamicObjectController;


    DynamicObjectController.prototype.addDynamicObject = function(name, view)
    {
        var model = this.modelLoader.getObjectDef(name);

        if (!model)
        {
            model = DynamicObject.create(this.gapiModel,name,"generated");
            this.modelLoader.addObject(name,model);
        }
        if (!model.hasState(this.state))
        {
            console.log("Adding current state '" + this.state + "' to generated model");
            model.createState(this.state);
        }

        var controller = new DynamicObjectController(model,this.modelLoader,view);
        DynamicKnowledge.EditManager.registerController(controller);
        this.addController(controller);
    };

    DynamicObjectController.prototype.createEditTrigger = function()
    {
        this.destroyEditTrigger();

        var trigger = new BoxView({
            size: [undefined, undefined],
            clickable: true,
            color: Colors.EditColor,
            position:[0,0,5],
            viewAlign:[0,0.5],
            viewOrigin:[0,0.5],
            style:"noBorder",
            isAnimated:false
        });

        trigger.setOpacity(0.3);
        trigger.setAnimated(false);

        this.objectView.add(trigger.getModifier()).add(trigger.getRenderController());

        this._activeEditTrigger = trigger;

        return trigger;
    };

    DynamicObjectController.prototype.destroyEditTrigger = function()
    {
        if (this._activeEditTrigger)
        {
            this._activeEditTrigger.hide();
        }
    };

    DynamicObjectController.prototype.makeMenuBar = function()
    {
        var menuBar = new MenuBar({
            viewOrigin:[0,1]
        });
        this.objectView.add(menuBar.getModifier()).add(menuBar.getRenderController());
        return menuBar;
    };

	DynamicObjectController.prototype.createEditors = function(editContext)
	{
        if (!this._activeEditorViews)
            this._activeEditorViews = [];

        var myEditors = this.createEditRules(editContext);

        var menuBar = (editContext.isGlobal) ? editContext.globalMenu : this.makeMenuBar();
        for (var e = 0; e < myEditors.length; e++)
        {
            var newEditor = this.makeEditor(myEditors[e]);

            if (!newEditor) continue;

            if (newEditor.isMenuButton)
            {
                newEditor.hide = function(){menuBar.removeChild(this);};
                menuBar.addChild(newEditor);
            }
            else if (newEditor.createUI)
            {
                console.debug("Creating editor UI");
                newEditor.createUI(menuBar);
            }

            this._activeEditorViews.push(newEditor);
        }

        if (!editContext.isGlobal)
        {
            menuBar.addChild(MenuBar.makeMenuButton(this.state));

            _loadObjectEditors.call(this,menuBar);

            if (menuBar.children.length > 0)
                this._activeEditorViews.push(menuBar);
            else
                menuBar.hide();
        }

    };

    DynamicObjectController.prototype.destroyEditors = function()
    {
        if (this._activeEditorViews)
        {
            for (var i = 0; i < this._activeEditorViews.length; i++)
            {
                this._activeEditorViews[i].hide();
            }
            this._activeEditorViews = [];
        }

        _cleanupObjectEditors.call(this);
	};

    function hasContainer(objectDef)
    {
        var relationships = objectDef.relationships.asArray();
        for (var i=0;i<relationships.length;i++)
        {
            if (relationships[i] instanceof Connection)
            {
                if (relationships[i].type == "container")
                {
                    return true;
                }
            }
        }

        return false;
    }

    DynamicObjectController.prototype.createEditRules = function(editContext)
	{
		var editors = [];

        if (editContext.isGlobal)
        {
            editors.push("add");
        }
        else
        {
            if (this.parent)
            {
                editors.push("delete");

                if (this.objectView.parent.childControlsPosition())
                {
                    editors.push("position");
                    editors.push("resize");
                }

                if (!hasContainer(this.objectDef))
                {
                    editors.push("containerize");
                }

                if (this.controllers.length > 0)
                {
                    editors.push("stateSelector");
                }
            }
        }

		return editors;
	};


	DynamicObjectController.prototype.propagateState = function(state)
    {
		AbstractObjectController.prototype.propagateState.call(this,state);
		updateObjectState.call(this);
	};


	DynamicObjectController.prototype.getOutputs = function()
	{
		var outputs = AbstractObjectController.prototype.getOutputs.call(this);
		if (this.objectView.getOutputEvents)
		{
			outputs.push(this.objectView.getOutputEvents());
		}

		return outputs;
	};

	DynamicObjectController.prototype.getInputs = function(name)
	{
        var inputs = AbstractObjectController.prototype.getInputs.call(this);

		if (this.objectView.getInputEvents)
		{
			var objectInputs = this.objectView.getInputEvents();

            if (!name || objectInputs[name])
                inputs.push(objectInputs);
		}

		return inputs;
	};

	DynamicObjectController.prototype.getView = function()
	{
		return this.objectView;
	};

	function updateObjectState()
	{
        console.debug("Updating object state to " + this.state);

		if (!this.objectDef)
			return;

		if (this.objectDef.hasState(this.state))
		{
			if (this.objectView && this.objectView.applyProperties)
				this.objectView.applyProperties(this.objectDef.getState(this.state).properties);
		}
		else
		{
			console.error("State '" + this.state + "' not defined for object '" + this.objectDef.id + "'");
			//Handle no state defined
		}
	}

    function _loadObjectEditors(menuBar)
    {
        if (this.objectView && this.objectView.getEditors)
        {
            var editors = this.objectView.getEditors();
            for (var i=0;i<editors.length;i++)
            {
                var editor = editors[i];
                editor.createUI(menuBar);
                editor.setModel(this.objectDef,this.state);
            }
            this.activeEditors = editors;
        }
    }

    function _cleanupObjectEditors()
    {
        if (this.activeEditors)
        {
            for (var i=0;i<this.activeEditors.length;i++)
            {
                this.activeEditors[i].cleanup();
            }
        }
    }

	DynamicObjectController.prototype.makeEditor = function(editorName)
	{
		switch (editorName)
		{
			case "position":
				return (new EditorFactory()).addMoveEditor(this.objectView,function(newPosition)
                {
                    console.debug("Saving position for state '" + this.state + "'");
                    this.objectDef.getState(this.state).properties.set('position',newPosition);
                }.bind(this));
			case "size":
                return (new EditorFactory()).addSizeEditor(this.objectView,function(newSize)
                {
                    this.objectDef.getState(this.state).properties.set('size',newSize);
                }.bind(this));
			case "delete":
                return (new EditorFactory()).addDeleteButton(this.objectView,function(){
                    this.parent.deleteControllerModel(this.objectDef);
                }.bind(this));
            case "containerize":
                var containerButton = new BoxView({
                    text: "[ ]", size: [40, 40], clickable: true, color: Colors.EditColor,
                    position: [0, 0, 5], viewAlign: [0, 0], viewOrigin: [0, 0], fontSize: 'large'
                });
                containerButton.on('click', function(){
                    containerButton.hide();
                    _addContainer.call(this);
                }.bind(this));
                containerButton.isMenuButton = true;
                return containerButton;
            case "stateSelector":
                var stateSelector = new ListSelector({
                    size:[120,40],
                    color: Colors.EditColor
                });
                var items = this.objectDef.getAllStates();
                items.push("+");
                items.splice(0,0,["---"])
                stateSelector.setItems(items);
                stateSelector.setSelectedItem(this._specifiedState || 0);

                stateSelector.on('itemSelected',function(data)
                {
                    var item = data.selectedItem;
                    if (item == "---")
                    {
                        this.setState(undefined);
                        this.propagateState(this.parent.state || 'base');
                    }
                    else if (item == "+")
                    {
                        var newStateName = "State_" + (items.length-2);
                        console.debug("Creating new state '" + newStateName + "'");
                        this.objectDef.createState(newStateName);
                        items.push(newStateName);
                        stateSelector.setItems(items);
                    }
                    else
                    {
                        this.setState(item);
                    }
                }.bind(this));
                stateSelector.isMenuButton = true;
                return stateSelector;
            default:
                return AbstractObjectController.prototype.makeEditor.call(this,editorName);
		}
	};

    function _addContainer()
    {
        var containerEdge = Connection.create(this.gapiModel,this.modelLoader.nextObjectId("ContainerEdge"),"container");

        var containerObject = DynamicObject.create(this.gapiModel,this.modelLoader.nextObjectId("Container"),"container");
        containerObject.createState(this.state);
        this.modelLoader.addObject(containerObject.id,containerObject);

        containerEdge.to = containerObject.id;
        this.objectDef.relationships.push(containerEdge);
    }



	module.exports = DynamicObjectController;
});