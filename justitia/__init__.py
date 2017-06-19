from ._version import version_info, __version__

from .suite import testsuite

def _jupyter_nbextension_paths():
    return [{
        'section': 'notebook',
        'src': 'static',
        'dest': 'justitia',
        'require': 'justitia/extension'
    }]
