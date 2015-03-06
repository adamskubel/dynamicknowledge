define(function(require,exports,module){


    function AbstractObjectController(objectDef,modelLoader)
    {
        this.objectDef = objectDef;
        this.controllers = [];
        this.gapiModel = gapi.drive.realtime.custom.getModel(this.objectDef);
        this.modelLoader = modelLoader;
        this.state = 'base';

        _attachModel.call(this,objectDef);
    }

    AbstractObjectController.prototype.getObjectDef = function(){
        return this.objectDef;
    };


    function _loadRelationship(relationship)
    {
        console.log(relationship.type);
        if (relationship instanceof AnnotationContainer)
        {
            var ac = new AnnotationController(relationship,this.modelLoader);

            this.addController(ac);
        }
        else if (relationship instanceof Connection)
        {
            console.debug("Adding connection relationship: '" + relationship.from + "' -> '" + relationship.to + "'");
            var fromView = this.modelLoader.getObject(relationship.from).objectView;
            var toView = this.modelLoader.getObject(relationship.to).objectView;

            var output = fromView.getOutputEvents()[relationship.type];
            var input = toView.getInputEvents()[relationship.type];

            if (output && input)
            {
                fromView.pipe(toView);

                var connectionLine = new LineCanvas();
                connectionLine.parent = this.getView();
                this.getView().add(connectionLine.getModifier()).add(connectionLine.getRenderController());

                console.log("Binding to " + input._globalId);
                output.parent.on('positionChange', function (){
                    output._eventOutput.emit('positionChange');
                });

                input.parent.on('positionChange',function(){
                    input._eventOutput.emit('positionChange');
                });

                connectionLine.setLineObjects(output,input);
            }
            else
            {
                console.error("Can't find event type '" + relationship.type + "' on views");
            }

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

    AbstractObjectController.prototype.getOutputs = function()
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

        return outputs;
    };

    AbstractObjectController.prototype.getInputs = function(name)
    {
        var inputs = [];
        for (var i=0;i<this.controllers.length;i++)
        {
            if (this.controllers[i].getInputs)
            {
                var c = this.controllers[i].getInputs(name);
                if (c instanceof Array)
                {
                    for (var j=0;j< c.length;j++)
                        inputs.push(c[j]);
                }
                else if (c)
                    inputs.push(c);
            }
        }

        return inputs;
    };

    AbstractObjectController.prototype.createEditTrigger = function()
    {
          throw "HOLY SHIT";
    };

    AbstractObjectController.prototype.destroyEditTrigger = function()
    {
        throw "HOLY SHIT";
    };

    AbstractObjectController.prototype.createEditors = function(editContext)
    {

    };

    AbstractObjectController.prototype.destroyEditors = function()
    {

    };

    AbstractObjectController.prototype.createGlobalEditors = function()
    {

    };

    AbstractObjectController.prototype.setEditMode = function(editMode, editContext)
    {
        if (!editContext)
            editContext = {};

        if (editMode == "IsEditing")
        {
            var trigger = this.createEditTrigger();
            trigger.on('click',function(){
                this.createEditors(editContext);
            }.bind(this));
        }
        else
        {
            this.destroyEditors();
        }

        for (var i=0;i<this.controllers.length;i++)
        {
            this.controllers[i].setEditMode(editMode, editContext);
        }
    };

    module.exports = AbstractObjectController;

});