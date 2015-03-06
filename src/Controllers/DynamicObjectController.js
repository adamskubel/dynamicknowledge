define(function(require,exports,module){

	var DynamicContainer = require('PositioningLayouts/DynamicContainer');
	var BoxView = require('PositioningLayouts/BoxView');

	var MouseSync = require('famous/inputs/MouseSync');
	var Vector = require('ProperVector');
	var LineCanvas = require('LineCanvas');
	var Colors = require('Colors');
    var Transform = require('famous/core/Transform');
    var Modifier = require('famous/core/Modifier');

	var PSequenceView = require('PositioningLayouts/PSequenceView');
	var AccessInspector = require('intrinsics/AccessInspector');

	var ObjectEditModule = require('Modules/ObjectEditModule');
	var DynamicObject = require('Model/DynamicObject');
	var DynamicConstraintLayout = require('PositioningLayouts/DynamicConstraintLayout');

	var AnnotationController = require('Controllers/AnnotationController');
	var AnnotationContainer = require('Model/AnnotationContainer');

    var Surface = require('famous/core/Surface');

    var Connection = require('Model/Connection');
	var Utils = require('Utils');

    var AbstractObjectController = require('./AbstractObjectController');

	function DynamicObjectController(objectDef, objectView, modelLoader)
	{
        AbstractObjectController.call(this);

		this.objectView = objectView;
		this.objectDef = objectDef;
		this.controllers = [];
		this.gapiModel = gapi.drive.realtime.custom.getModel(this.objectDef);
		this.modelLoader = modelLoader;
		this.state = 'base';

        this.objectView.modelId = this.objectDef.id;

		var pmap = Utils.getPropertyMap(objectDef.properties);

        if (objectView.setController)
            objectView.setController(this);

		objectView.applyProperties(pmap);
		_attachModel.call(this,objectDef);
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

	DynamicObjectController.prototype.setEditMode = function(editMode, editConfig)
	{
		this.editMode = editMode;
		var childConfig;



		if (editMode == "IsEditing")
		{
            var editButton = _getObject.call(this,"editButton");
            childConfig = this.makeChildEditConfig(editConfig);

            var myEditors = _getEditableProperties.call(this, editConfig);

            for (var e = 0; e < myEditors.length; e++)
            {
                _enableEditor.call(this, myEditors[e]);
            }

            _loadObjectEditors.call(this,childConfig);

            this._activeChildEditConfig = childConfig;

            var showEditors = function()
            {
                if (this.menuBar)
                    this.menuBar.show();
                if (this.menuBar_container)
                    this.menuBar_container.show();
                if (this.objectEditor)
                    this.objectEditor.show();
                if (this.containerObjectEditor)
                    this.containerObjectEditor.show();

                editButton.hide();
            };

            editButton.on('click',showEditors.bind(this));
            editButton.show();

            for (var i=0;i<this.controllers.length;i++)
            {
                this.controllers[i].setEditMode(editMode,childConfig);
            }
		}
		else
		{

			if (this.menuBar)
				this.menuBar.hide();

            if (this.menuBar_container)
                this.menuBar_container.hide();

			if (this.objectEditor)
				this.objectEditor.hide();

			if (this.containerObjectEditor)
				this.containerObjectEditor.hide();

            if (this.editButton)
                this.editButton.hide();


            for (var i=0;i<this.controllers.length;i++)
            {
                this.controllers[i].setEditMode(editMode,childConfig);
            }

            _cleanupObjectEditors.call(this);
		}


	};

    function _viewConnected(data)
    {
        var fromView = data.from;
        var toView = data.to;

        var connection = Connection.create(this.gapiModel,this.modelLoader.nextObjectId("Connection"));

        connection.type = data.type;
        connection.from = fromView.modelId;
        connection.to = toView.modelId;

        this.objectDef.relationships.push(connection);

        console.debug("Creating connection relationship: '" + connection.from + "' -> '" + connection.to + "'");
    }

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


	DynamicObjectController.prototype.getObjectDef = function(){
		return this.objectDef;
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

	function _enableEditor(editorName)
	{
		//console.debug("Enabling editor '" + editorName + "' for object " + this.objectDef.id);
		var menuBar = _getObject.call(this,"menuBar");
		var editor =  _getObject.call(this,"objectEditor");
		var containerEditor =  _getObject.call(this,"objectEditor_container");

		switch (editorName)
		{
			case "position":
				editor.onObjectMoved(function ()
				{
					this.objectDef.properties.set("position", this.objectView.position);
				}.bind(this));
				editor.hide();

				if (this.containerView && this.containerView != this.objectView && this.containerView.parent.childControlsPosition())
				{
					containerEditor.onObjectMoved(function ()
					{
						//this.objectDef.properties.set("position", this.containerView.position);
					}.bind(this));
					containerEditor.hide();
				}
				break;
			case "size":
				editor.onObjectResized(function ()
				{
					this.objectDef.properties.set("size", this.objectView.position);
				}.bind(this));
				editor.hide();
				break;
			case "delete":
				editor.onObjectDelete(function ()
				{
					;
				}.bind(this));
				editor.hide();
				break;
			case "add":
				var addButton = _getObject.call(this,"addObjectButton");
				if (menuBar.indexOfChild(addButton) < 0)
					menuBar.addChild(addButton);

				this.menuBar.hide();
				break;
			case "connect":
				var connectButton = _getObject.call(this,"addConnectionButton");
				if (menuBar.indexOfChild(connectButton) < 0)
					menuBar.addChild(connectButton);
				this.menuBar.hide();
				break;
			case "annotate":
				var annotateButton = _getObject.call(this,"annotateButton");
				if (menuBar.indexOfChild(annotateButton) < 0)
					menuBar.addChild(annotateButton);
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
		//We already added this controller
		else if (controller.getView() && controller.getView().parent == this.containerView)
		{
			console.warn("Already added controller");
		}
		//Controller needs a container
		else
		{
			if (!this.containerView)
			{
				this.containerView = _makeContainerView();

				if (this.objectView)
				{
					injectView(this.containerView, this.objectView);

					if (this.menuBar)
					{
						this.menuBar.hide();
						this.menuBar = undefined;
						_getObject.call(this,"menuBar")
					}
				}
			}

			var dc = this.containerView;

			//Controller parasitizes a parent container
			if (controller.setContainer)
			{
				controller.setContainer(dc);
			}
			//Controller lives in a parent container
			else
			{
				var controllerView = controller.getView();
				if (!controllerView)
					console.error("Controller has null view");
				else if (controllerView == dc)
					console.error("Controller's view is my container...");
				else if (controllerView.parent == dc)
					console.error("Controller's view already belongs to DC");
				else
					dc.addChild(controllerView);
			}
		}
	}

	function _addAnnotationController()
	{
		var acDef = AnnotationContainer.create(this.gapiModel,this.modelLoader.nextObjectId("AC"));
		this.objectDef.relationships.push(acDef);
		_getObject.call(this,"menuBar").removeChild(this.annotateButton);
	}

	function _getObject(name)
	{
		switch (name)
		{
			case "annotateButton":
				if (!this.annotateButton)
				{
					var annotateButton = new BoxView({
						text: "[A]", size: [40, 40], clickable: true, color: Colors.EditColor,
						position: [0, 0, 5], viewAlign: [0, 0], viewOrigin: [0, 0], fontSize: 'large'
					});
					annotateButton.on('click', _addAnnotationController.bind(this));
					this.annotateButton = annotateButton;
				}
				return this.annotateButton;
			case "menuBar":
				if (!this.menuBar)
				{
					var menuBar = new PSequenceView({
						direction: 0,
						size: [200, 40],
                        position:[0,0,5],
                        viewAlign:[0,0],
                        viewOrigin:[0,1]
					});

                    menuBar.add(new Modifier({transform:Transform.translate(0,0,-1)})).add(new Surface({
                        properties:{
                            backgroundColor : Colors.get([0,0,0],0.5)
                        }
                    }));

					this.objectView.add(menuBar.getModifier()).add(menuBar.getRenderController(true));

					this.menuBar = menuBar;
				}
				return this.menuBar;
            case "menuBar_container":
                if (!this.menuBar_container)
                {
                    var containerBar = new PSequenceView({
                        direction: 0,
                        size: [200, 40],
                        position:[0,0,5],
                        viewAlign:[0,0],
                        viewOrigin:[0,1]
                    });

                    containerBar.add(new Modifier({transform:Transform.translate(0,0,-1)})).add(new Surface({
                        properties:{
                            backgroundColor : Colors.get([0,0,0],0.5)
                        }
                    }));

                    this.containerView.add(containerBar.getModifier()).add(containerBar.getRenderController(true));

                    this.menuBar_container = containerBar;
                }
                return this.menuBar_container;
			case "objectEditor":
				if (!this.objectEditor)
					this.objectEditor = new ObjectEditModule(this.objectView);
				return this.objectEditor;
			case "objectEditor_container":
				if (!this.containerView)
					return null;
				if (!this.containerObjectEditor)
					this.containerObjectEditor = new ObjectEditModule(this.containerView);
				return this.containerObjectEditor;
            case "editButton":
                if (!this.editButton)
                {
                    this.editButton = new BoxView({
                        size: [10, undefined],
                        clickable: true,
                        color: Colors.EditColor,
                        position:[0,0,10],
                        viewAlign:[0,0.5],
                        viewOrigin:[0,0.5]
                    });

                    this.getView().add(this.editButton.getModifier()).add(this.editButton.getRenderController());
                }
                return this.editButton;
			default:
				console.error("Can't make object '" + name + "'");
				return undefined;
		}
	}


	module.exports = DynamicObjectController;
});