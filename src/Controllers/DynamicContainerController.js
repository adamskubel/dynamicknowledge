define(function(require,exports,module){

    var AbstractObjectController = require('./AbstractObjectController');
    var DynamicConstraintLayout = require('PositioningLayouts/DynamicConstraintLayout');
    var BoxView = require('PositioningLayouts/BoxView');

    function DynamicContainerController()
    {
        this.containerView = _makeContainerView();
    }

    DynamicContainerController.prototype = Object.create(AbstractObjectController.prototype);
    DynamicContainerController.prototype.constructor = DynamicContainerController;



    DynamicContainerController.prototype.getView = function()
    {
        return this.containerView;
    };




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

    function _makeEditor(name)
    {
        switch(name)
        {
            case "add":
                return new ObjectCreationModule(this.objectDef);
            case "connect":
                return new LineConnectionModule();
        }
    }




    module.exports = DynamicContainerController;

});