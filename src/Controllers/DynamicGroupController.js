define(function(require,exports,module){

    var DynamicContainer = require('PositioningLayouts/DynamicContainer');

    function DynamicGroupController(groupDef)
    {
        this.objectDef = groupDef;
        this.controllers = [];
        this.state = 'base';
    }

    DynamicGroupController.prototype.addController = function(controller){
        this.controllers.push(controller);
        controller.setState(this.state);
        controller.setEditMode(this.editMode);
    };

    DynamicGroupController.prototype.setEditMode = function(editMode){

        this.editMode = editMode;
        for (var i=0;i<this.controllers.length;i++)
        {
            this.controllers[i].setEditMode(editMode);
        }
    };

    DynamicGroupController.prototype.setState = function(state){
        this.state = state;

        for (var i=0;i<this.controllers.length;i++)
        {
            this.controllers[i].setState(state);
        }
    };

    DynamicGroupController.prototype.getView = function(){
        if (!this.containerView)
            this.containerView = _makeContainerView.call(this);

        return this.containerView;
    };

    DynamicGroupController.prototype.getObjectDef = function(){
        return this.objectDef;
    };

    function _makeContainerView()
    {
        var dc = new DynamicContainer();

        for (var i=0;i<this.controllers.length;i++)
        {
            _addController(dc,this.controllers[i]);
        }

        return dc;
    }

    function _addController(dc,controller)
    {
        var controllerView = controller.getView(dc);

        if (controllerView != dc)
            dc.addChild(controllerView);
    }

    module.exports = DynamicGroupController;
});