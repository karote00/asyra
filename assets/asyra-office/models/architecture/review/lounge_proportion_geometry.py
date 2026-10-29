"""Recover the proposal lounge ratios from the owner's marked image corners."""
import math


def reconstruct(parameters, shell, floor, trace):
    points = trace['points']
    thickness = shell['partitionThickness']
    x0 = parameters['loungeX'] + thickness / 2
    x_end = shell['eastX'] + shell['exteriorThickness'] / 2
    width = x_end - x0
    rear_runs = [('rearLeft', 'rearLeftEnd'), ('rearMiddleStart', 'rearMiddleEnd'),
                 ('rearRightStart', 'rearRightEnd')]
    source_width = points['rearRightEnd'][0] - points['rearLeft'][0]
    slope_x = sum(points[b][1]-points[a][1] for a, b in rear_runs) / source_width
    high_dx = points['leftHighRear'][0] - points['leftHighFront'][0]
    slope_y = (points['leftHighFront'][1]-points['leftHighRear'][1]) / high_dx
    azimuth = math.atan(math.sqrt(slope_x / slope_y))
    elevation = math.asin(math.sqrt(slope_x * slope_y))
    pixels_x = source_width / width
    scale = pixels_x / math.cos(azimuth)
    pixels_y = scale * math.sin(azimuth)
    pixels_z = scale * math.cos(elevation)
    front = shell['frontY'] + shell['facadeThickness'] / 2
    depth = (points['leftHighRear'][0]-points['leftLowFront'][0]) / pixels_y
    rear_face_y = front + depth
    high_length = high_dx / pixels_y
    # Source floor at the rear corner, translated from the visible high-return foot.
    base_y = points['leftHighFoot'][1] - high_dx * slope_y

    def height(point):
        x, y = points[point]
        return floor + (base_y + (x-points['rearLeft'][0])*slope_x - y) / pixels_z

    parameters.update({
        'loungeY': rear_face_y + thickness/2,
        'returnLength': high_length + thickness/2,
        'returnTop': floor + (base_y-points['leftHighRear'][1])/pixels_z,
        'loungeTop': height('rearLeft'),
        'loungeRightTop': height('rearRightStart'),
        'loungeSplit': x0 + (points['rearMiddleStart'][0]-points['rearLeft'][0])/pixels_x,
    })
    right_step = x0 + (points['rearRightStart'][0]-points['rearLeft'][0])/pixels_x
    return {
        'rightStep': right_step,
        'middleTop': height('rearMiddleStart'),
        'leftLowTop': floor + (points['leftHighFoot'][1]-points['leftStepLow'][1])/pixels_z,
        'highLength': high_length, 'lowLength': depth-high_length,
        'rearWidth': width, 'depth': depth,
        'branchLength': (points['branchRear'][0]-points['rearRightStart'][0])/pixels_y - thickness/2,
        'viewAzimuth': math.degrees(azimuth), 'viewElevation': math.degrees(elevation),
        'projection': {'origin': [x0, rear_face_y, floor],
                       'imageOrigin': [points['rearLeft'][0], base_y],
                       'xAxis': [pixels_x, pixels_x*slope_x],
                       'yAxis': [pixels_y, -pixels_y*slope_y],
                       'zAxis': [0, -pixels_z]},
    }


def project(point, basis):
    delta = [point[i]-basis['origin'][i] for i in range(3)]
    return [basis['imageOrigin'][i] + sum(delta[j]*basis[a][i]
            for j, a in enumerate(['xAxis','yAxis','zAxis'])) for i in range(2)]


def wall_corners(walls):
    """Read crown corners from emitted wall records, not a second display model."""
    w = {wall['id']: wall for wall in walls}
    a, b, c = [w['lounge rear '+name] for name in ['left','middle','right']]
    low, high = w['lounge left low'], w['lounge left return']
    branch = w['lounge T return']
    x = high['cross'] + high['thickness']/2
    y = a['cross'] - a['thickness']/2
    return {
        'rearLeft': [x,y,a['top']], 'rearLeftEnd': [a['end'],y,a['top']],
        'rearMiddleStart': [b['start'],y,b['top']], 'rearMiddleEnd': [b['end'],y,b['top']],
        'rearRightStart': [c['start'],y,c['top']], 'rearRightEnd': [c['end'],y,c['top']],
        'leftHighRear': [x,y,high['top']], 'leftHighFront': [x,high['start'],high['top']],
        'leftStepLow': [x,low['end'],low['top']], 'leftLowFront': [x,low['start'],low['top']],
        'leftHighFoot': [x,high['start'],high['base']],
        'branchRear': [branch['cross']-branch['thickness']/2,branch['end'],branch['top']],
    }
