import ipywidgets as widgets
import sys
from traitlets import Unicode, Tuple
from IPython.display import clear_output
from IPython import get_ipython

@widgets.register('justitia.StatefulOutput')
class StatefulOutput(widgets.DOMWidget):
    """Widget used as a context manager to display output.

    This widget can capture and display stdout, stderr, and rich output.  To use
    it, create an instance of it and display it.  Then use it as a context
    manager.  Any output produced while in it's context will be captured and
    displayed in it instead of the standard output area.

    Example::
        import ipywidgets as widgets
        from IPython.display import display
        out = widgets.Output()
        display(out)

        print('prints to output area')

        with out:
            print('prints to output widget')
    """
    _view_name = Unicode('StatefulOutputView').tag(sync=True)
    _model_name = Unicode('StatefulOutputModel').tag(sync=True)
    _view_module = Unicode('justitia').tag(sync=True)
    _model_module = Unicode('justitia').tag(sync=True)
    msg_id = Unicode('', help="Parent message id of messages to capture").tag(sync=True)
    outputs = Tuple(help="The output messages synced from the frontend.").tag(sync=True)

    def clear_output(self, *pargs, **kwargs):
        with self:
            clear_output(*pargs, **kwargs)

    def __enter__(self):
        """Called upon entering output widget context manager."""
        self._flush()
        ip = get_ipython()
        if ip and hasattr(ip, 'kernel') and hasattr(ip.kernel, '_parent_header'):
            self.msg_id = ip.kernel._parent_header['header']['msg_id']

    def __exit__(self, etype, evalue, tb):
        """Called upon exiting output widget context manager."""
        ip = get_ipython()
        if etype is not None:
            ip.showtraceback((etype, evalue, tb), tb_offset=0)
        self._flush()
        self.msg_id = ''
        # suppress exceptions, since they are shown above
        return True

    def _flush(self):
        """Flush stdout and stderr buffers."""
        sys.stdout.flush()
        sys.stderr.flush()
