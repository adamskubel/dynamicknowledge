define(function(require,exports,module){

	var DynamicContainer = require('PositioningLayouts/DynamicContainer');
	var BoxView = require('PositioningLayouts/BoxView');

	var MouseSync = require('famous/inputs/MouseSync');
	var Vector = require('ProperVector');
	var LineCanvas = require('LineCanvas');
	var Colors = require('Colors');

	var PSequenceView = require('PositioningLayouts/PSequenceView');
	var AccessInspector = require('intrinsics/AccessInspector');

	var ObjectEditModule = require('Modules/ObjectEditModule');
	var DynamicObject = require('Model/DynamicObject');
	var DynamicConstraintLayout = require('PositioningLayouts/DynamicConstraintLayout');

	var AnnotationController = require('Controllers/AnnotationController');
	var AnnotationContainer = require('Model/AnnotationContainer');

	var Utils = require('Utils');

	function DynamicObjectController(objectDef, objectView, modelLoader)
	{
		this.objectView = objectView;
		this.objectDef = objectDef;
		this.controllers = [];
		this._gapiModel = gapi.drive.realtime.custom.getModel(this.objectDef);
		this.modelLoader = modelLoader;
		this.state = 'base';

		var pmap = Utils.getPropertyMap(objectDef.properties);
		objectView.applyProperties(pmap);
		_attachModel.call(this,objectDef);
	}

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
			var myEditors = _getEditableProperties.call(this,editConfig);

			for (var e=0;e<myEditors.length;e++)
			{
				_enableEditor.call(this,myEditors[e]);
			}

			childConfig = this.makeChildEditConfig(editConfig);
			this._activeChildEditConfig = childConfig;
		}
		else
		{
			if (this.menuBar)
				this.menuBar.hide();

			if (this.objectEditor)
				this.objectEditor.hide();

			if (this.containerObjectEditor)
				this.containerObjectEditor.hide();
		}


		for (var i=0;i<this.controllers.length;i++)
		{
			this.controllers[i].setEditMode(editMode,childConfig);
		}
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
		editConfig.menuBar = _getObject.call(this, "menuBar");
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
		var outputs = [];
		for (var i=0;i<this.controllers.length;i++)
		{
			if (this.controllers[i].getOutputs)
			{
				var c = this.controllers[i].getOutputs();
				if (c instanceof Array)
				{
					for (var j=0;j< c.length;j++)
						outputs.push(c[j]);
				}
				else if (c)
					outputs.push(c);
			}
		}

		if (this.objectView.getOutputEvents)
		{
			outputs.push(this.objectView.getOutputEvents());
		}

		return outputs;
	};

	DynamicObjectController.prototype.getInputs = function()
	{
		var inputs = [];
		for (var i=0;i<this.controllers.length;i++)
		{
			if (this.controllers[i].getInputs)
			{
				var c = this.controllers[i].getInputs();
				if (c instanceof Array)
				{
					for (var j=0;j< c.length;j++)
						inputs.push(c[j]);
				}
				else if (c)
					inputs.push(c);
			}
		}

		if (this.objectView.getInputEvents)
		{
			inputs.push(this.objectView.getInputEvents());
		}

		return inputs;
	};

	DynamicObjectController.prototype.getView = function()
	{
		return (this.containerView || this.objectView);
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

	function _relationshipsAdded(event)
	{
		for (var i = 0; i < event.values.length; i++)
		{
			_loadRelationship.call(this,event.values[i]);
		}
	}

	function _relationshipsRemoved(event)
	{
		console.error("REMOVING IS NOT SUPPORTED, GOT IT?");
	}

	function _attachModel(model)
	{
		var relationshipList = model.relationships;

		var r = relationshipList.asArray();
		for (var i=0;i < r.length;i++)
		{
			_loadRelationship.call(this,r[i]);
		}

		relationshipList.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED,_relationshipsAdded.bind(this));
		relationshipList.addEventListener(gapi.drive.realtime.EventType.VALUES_REMOVED, _relationshipsRemoved.bind(this));
		relationshipList.addEventListener(gapi.drive.realtime.EventType.VALUES_SET, function(){
			console.error("SET IS NOT SUPPORTED OK");
		});
	}

	function _loadRelationship(relationship)
	{
		console.log(relationship.type);
		if (relationship instanceof AnnotationContainer)
		{
			var ac = new AnnotationController(relationship,this.modelLoader);

			this.addController(ac);
		}
		else if (relationship.type == "List")
		{
			for (var x=0;x<relationship.length;x++)
			{
				var child = relationship.get(x);
				this.addController(this.modelLoader.getObject(child));
			}
		}
		else if (relationship.type == "EditableString")
		{
			this.addController(this.modelLoader.getObject(relationship.toString()));
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
				editor.show();

				if (this.containerView && this.containerView != this.objectView && this.containerView.parent.childControlsPosition())
				{
					containerEditor.onObjectMoved(function ()
					{
						//this.objectDef.properties.set("position", this.containerView.position);
					}.bind(this));
					containerEditor.show();
				}
				break;
			case "size":
				editor.onObjectResized(function ()
				{
					this.objectDef.properties.set("size", this.objectView.position);
				}.bind(this));
				editor.show();
				break;
			case "delete":
				editor.onObjectDelete(function ()
				{
					;
				}.bind(this));
				editor.show();
				break;
			case "add":
				var addButton = _getObject.call(this,"addObjectButton");
				if (menuBar.indexOfChild(addButton) < 0)
					menuBar.addChild(addButton);

				this.menuBar.show();
				break;
			case "connect":
				var connectButton = _getObject.call(this,"addConnectionButton");
				if (menuBar.indexOfChild(connectButton) < 0)
					menuBar.addChild(connectButton);
				this.menuBar.show();
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

	function injectView(container,objectView)
	{
		console.log("Injecting view. Object = " + objectView._globalId + " InjectedContainer = " + container._globalId);
		objectView.setPosition([0, objectView.position[1], 0]);
		objectView.setAlign([0,0]);
		objectView.setOrigin([0,0]);
		if (objectView.parent)
		{
			var index = objectView.parent.children.indexOf(objectView);

			objectView.parent.removeChild(objectView);
			objectView.parent.addChild(container, {
				weight: 2,
				index: index,
				align: 'center'
			});
		}
		container.addChild(objectView);
	}

	function _makeContainerView()
	{
		var dc = new DynamicConstraintLayout();

		var containerBackground = new BoxView({
			color: 2000,
			style: 'borderOnly',
			size: [undefined,undefined]
		});

		dc.add(containerBackground.getModifier()).add(containerBackground.getRenderController());

		return dc;
	}

	function _addController(controller)
	{;
		//Controller already belongs to this controller's objectview
		if (controller.getView() && controller.getView().parent == this.objectView)
		{
			;
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
		var acDef = AnnotationContainer.create(this._gapiModel,this.modelLoader.nextObjectId("AC"));
		this.objectDef.relationships.push(acDef);
		_getObject.call(this,"menuBar").removeChild(this.annotateButton);
	}

	function _getObject(name)
	{
		switch (name)
		{
			case "addObjectButton":
				if (!this.addObjectButton)
				{
					var addObjectButton = new BoxView({
						text: "+", size: [40, 40], clickable: true, color: Colors.EditColor,
						position: [0, 0, 5], viewAlign: [0, 0], viewOrigin: [0, 1], fontSize: 'large'
					});
					addObjectButton.on('click', _addObject.bind(this));
					this.addObjectButton = addObjectButton;
				}
				return this.addObjectButton;
			case "addConnectionButton":
				if (!this.addConnectionButton)
				{
					var addConnectionButton = new BoxView({
						text: ">>", size: [40, 40], clickable: true, color: Colors.EditColor,
						position: [0, 0, 5], viewAlign: [0, 0], viewOrigin: [0, 1], fontSize: 'large'
					});
					addConnectionButton.on('click', _showConnections.bind(this));
					this.addConnectionButton = addConnectionButton;
				}
				return this.addConnectionButton;
			case "annotateButton":
				if (!this.annotateButton)
				{
					var annotateButton = new BoxView({
						text: "[A]", size: [40, 40], clickable: true, color: Colors.EditColor,
						position: [0, 0, 5], viewAlign: [0, 0], viewOrigin: [0, 1], fontSize: 'large'
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
						size: [200, 40]
					});

					if (this.containerView)
					{
						this.containerView.add(menuBar.getModifier()).add(menuBar.getRenderController());
					}
					else
					{
						this.objectView.add(menuBar.getModifier()).add(menuBar.getRenderController());
					}

					this.menuBar = menuBar;
				}
				return this.menuBar;
			case "objectEditor":
				if (!this.objectEditor)
					this.objectEditor = new ObjectEditModule(this.objectView);
				return this.objectEditor
			case "objectEditor_container":
				if (!this.containerView)
					return null;
				if (!this.containerObjectEditor)
					this.containerObjectEditor = new ObjectEditModule(this.containerView);
				return this.containerObjectEditor;
			default:
				console.error("Can't make object '" + name + "'");
				return undefined;
		}
	}

	function _addObject()
	{
		var model = gapi.drive.realtime.custom.getModel(this.objectDef);
		var objDef = DynamicObject.create(model,this.modelLoader.nextObjectId('AccessInspector'),'constructed');
		objDef.properties.set("constructorName","AccessInspector");

		this.modelLoader.addObject(objDef.id,objDef);

		this.objectDef.relationships.push(model.createString(objDef.id));
	}

	//Connection stuff
	function _showConnections()
	{
		var inputs = this.getInputs();
		var outputs = this.getOutputs();

		function getInputs(eventName)
		{
			var destinations = [];
			for (var x=0;x<inputs.length;x++)
			{
				if (inputs[x][eventName])
					destinations.push(inputs[x][eventName]);
			}
			return destinations;
		}

		for (var i=0;i<outputs.length;i++)
		{
			var out = outputs[i];
			for (var name in out)
			{
				console.log("Adding line drawing to anchor with name: " + name);
				_addLineDrawingToAnchor.call(this, out[name],getInputs(name));
			}
		}
	}

	function _configureDestinationAnchors(originAnchor, destinations)
	{
		for (var i=0;i<destinations.length;i++)
		{
			destinations[i].show();
			destinations[i].pulse(500,5000);
			_addReceivingAnchors(originAnchor,destinations[i]);
		}
	}

	function _addReceivingAnchors(originAnchor, destAnchor)
	{
		destAnchor.textSurface.on('mousemove', function ()
		{
			originAnchor.activeReceiver = destAnchor;
		});

		destAnchor.backSurface.on('mouseleave', function ()
		{
			originAnchor.activeReceiver = undefined;
		});

		originAnchor.on('draw_end', function (activeReceiver)
		{
			if (destAnchor != activeReceiver)
				destAnchor.hide();
		});
	}

	function _addLineDrawingToAnchor(sourceAnchor, destinations)
	{
		var parentView = this.getView();

		sourceAnchor.show();

		var lineSync = new MouseSync({
			propogate: true
		});

		var line = new LineCanvas();
		parentView.add(line.getModifier()).add(line);

		sourceAnchor.activeLine = line;
		sourceAnchor.activeLine.parent = parentView;

		lineSync.on('start', function (data)
		{
			_configureDestinationAnchors.call(this, sourceAnchor, destinations);
			sourceAnchor.activeLineEnd = Vector.fromArray(sourceAnchor.calculatePosition(parentView));
		}.bind(this));

		lineSync.on('update', function (data)
		{
			sourceAnchor.activeLineEnd = Vector.fromArray(data.delta).add(sourceAnchor.activeLineEnd);
			sourceAnchor.activeLine.setLinePoints(sourceAnchor.calculatePosition(parentView), sourceAnchor.activeLineEnd.toArray());
		});

		lineSync.on('end', function (data)
		{
            var destAnchor = sourceAnchor.activeReceiver;
			if (destAnchor)
			{
				console.log("Binding to " + destAnchor._globalId);
				sourceAnchor.parent.on('positionChange', function (){
					sourceAnchor._eventOutput.emit('positionChange');
				});

                destAnchor.parent.on('positionChange',function(){
                    destAnchor._eventOutput.emit('positionChange');
                });

                sourceAnchor.parent._eventOutput.emit('connected',{ from:sourceAnchor.parent, to:destAnchor.parent});

				sourceAnchor.activeLine.setLineObjects(sourceAnchor, destAnchor);
			}
			sourceAnchor._eventOutput.emit('draw_end', destAnchor);
		});

		sourceAnchor.backSurface.pipe(lineSync);
		sourceAnchor.textSurface.pipe(lineSync);
		sourceAnchor._drawMouseSync = lineSync;
	}

	module.exports = DynamicObjectController;
});