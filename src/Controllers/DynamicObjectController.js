define(function(require,exports,module){

	var DynamicContainer = require('PositioningLayouts/DynamicContainer');
	var BoxView = require('PositioningLayouts/BoxView');

	var MouseSync = require('famous/inputs/MouseSync');
	var Vector = require('ProperVector');
	var LineCanvas = require('LineCanvas');
	var Colors = require('Colors');
    var Transform = require('famous/core/Transform');
    var Modifier = require('famous/core/Modifier');

	var AccessInspector = require('intrinsics/AccessInspector');

	var ObjectEditModule = require('Modules/ObjectEditModule');
	var DynamicObject = require('Model/DynamicObject');
    var Surface = require('famous/core/Surface');
    var Connection = require('Model/Connection');
	var Utils = require('Utils');

    var AbstractObjectController = require('./AbstractObjectController');
    var DynamicContainerController = require('.DynamicContainerController');

	function DynamicObjectController(objectDef, modelLoader, objectView)
	{
        AbstractObjectController.call(this,objectDef,modelLoader);

        this.objectView = objectView;
        this.objectView.modelId = this.objectDef.id;

        var pmap = Utils.getPropertyMap(objectDef.properties);

        if (objectView.setController)
            objectView.setController(this);

        objectView.applyProperties(pmap);
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

        var controller = new DynamicObjectController(model,view,this.modelLoader);
        this.addController(controller);
    };

	DynamicObjectController.prototype.addController = function(controller)
	{
		_addController.call(this,controller);

		this.controllers.push(controller);
		controller.parent = this;

		controller.setState(this.state);

		if (this._activeChildEditConfig)
			controller.setEditMode(this.editMode,this._activeChildEditConfig);
	};

    DynamicObjectController.prototype.createEditTrigger = function()
    {
        var trigger = new BoxView({
            size: [10, undefined],
            clickable: true,
            color: Colors.EditColor,
            position:[0,0,10],
            viewAlign:[0,0.5],
            viewOrigin:[0,0.5]
        });

        this.objectView.add(trigger.getModifier()).add(trigger.getRenderController());

        this._activeEditTrigger = trigger;

        return trigger;
    };

    DynamicObjectController.prototype.destroyEditTrigger = function()
    {
        if (this._activeEditTrigger)
            this._activeEditTrigger.hide();
    };

	DynamicObjectController.prototype.createEditors = function(editContext)
	{
        var myEditors = _getEditableProperties.call(this, editContext);

        for (var e = 0; e < myEditors.length; e++)
        {
            _enableEditor.call(this, myEditors[e]);
        }

        _loadObjectEditors.call(this);
    };

    DynamicObjectController.prototype.destroyEditors = function()
    {
        if (this.menuBar)
            this.menuBar.hide();

        if (this.objectEditor)
            this.objectEditor.hide();

        if (this.editButton)
            this.editButton.hide();

        _cleanupObjectEditors.call(this);
	};


	function _getEditableProperties(parentConfig)
	{
		var editors = [];

		if (this.parent)
			editors.push("position");

		editors.push("add");

		if (!parentConfig)
			editors.push("connect");

		var hasAnnotationController = false;
		for (var i=0;i<this.controllers.length;i++)
		{
			if (this.controllers[i] instanceof AnnotationController)
			{
				hasAnnotationController = true;
				break;
			}
		}

		if (!hasAnnotationController && this.parent)
			editors.push("annotate");


		return editors;
	}

	function _getChildEditableProperties(parentConfig)
	{
		return ["position"];
	}

	DynamicObjectController.prototype.makeChildEditConfig = function(parentConfig)
	{
		var editConfig = {};

        editConfig.viewMenu = _getObject.call(this, "menuBar");

        if (this.containerView)
            editConfig.containerMenu = _getObject.call(this, "menuBar_container");

        if (parentConfig)
            editConfig.globalMenu = parentConfig.containerMenu || parentConfig.viewMenu;
        else
            editConfig = editConfig.viewMenu;

		editConfig.editRules = _getChildEditableProperties.call(this,parentConfig);

		if (!parentConfig)
		{
			editConfig.owner = this;
			editConfig.depth = 0;
		}
		else
		{
			editConfig.owner = parentConfig.owner;
			editConfig.depth = parentConfig.depth + 1;
		}

		return editConfig;
	};

	DynamicObjectController.prototype.setState = function(state){
		this.state = state;

		updateObjectState();

		for (var i=0;i<this.controllers.length;i++)
		{
			this.controllers[i].setState(state);
		}
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

    function _loadObjectEditors(editContext)
    {
        if (this.objectView && this.objectView.getEditors)
        {
            console.log("Loading object editors");
            var editors = this.objectView.getEditors();
            for (var i=0;i<editors.length;i++)
            {
                var editor = editors[i];
                editor.createUI(editContext);

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

	function _createEditor(editorName)
	{
		switch (editorName)
		{
			case "position":
				return new PositionEditor(this.objectView,this.objectDef);
			case "size":
                return new SizeEditor(this.objectView,this.objectDef);
			case "delete":

				break;
			default:
				console.error("Editor '" + editorName + "' is not allowed");
				break;
		}
	};


	function _addController(controller)
	{
		//Controller already belongs to this controller's objectview
		if (controller.getView() && controller.getView().parent == this.objectView)
		{

		}
		//Container Controller
		else if (controller instanceof DynamicContainerController)
		{
            var container = controller.getView();
            injectView(container, this.objectView);
		}
	}

    function _addContainer()
    {
        this.objectDef.relationships.push();
    }


	function _getObject(name)
	{
		switch (name)
		{
			case "containerizeButton":
                var containerButton = new BoxView({
                    text: "[A]", size: [40, 40], clickable: true, color: Colors.EditColor,
                    position: [0, 0, 5], viewAlign: [0, 0], viewOrigin: [0, 0], fontSize: 'large'
                });
                containerButton.on('click', _addContainer.bind(this));
				return containerButton;
			case "menuBar":
				if (!this.menuBar)
				{
					var menuBar = new MenuBar();
					this.objectView.add(menuBar.getModifier()).add(menuBar.getRenderController(true));
					this.menuBar = menuBar;
				}
				return this.menuBar;
			default:
				console.error("Can't make object '" + name + "'");
				return undefined;
		}
	}


	module.exports = DynamicObjectController;
});