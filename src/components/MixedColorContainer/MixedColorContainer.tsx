import React from 'react'
import styles from './MixedColorContainer.module.scss'
import { normalizeRgbString } from '../../utils/colorConversion'
import tinycolor from "tinycolor2"

interface MixedColorContainerProps {
    mixedColor: string
    mixedColorName: string
    isUsingTargetColor: boolean
    matchPercentage: string
}

const MixedColorContainer: React.FC<MixedColorContainerProps> = ({ mixedColor, mixedColorName, isUsingTargetColor, matchPercentage }) => {

    const isTransparentMixedColor = tinycolor(normalizeRgbString(mixedColor)).getAlpha() === 0
    //only show the color hex and name if the color is not transparent

    if (isTransparentMixedColor) {
    }

    return (
        <section className={ styles.MixedColorContainer }
            style={ {
                backgroundColor: mixedColor,
                color: tinycolor(mixedColor).isDark() ? 'white' : 'black'
            } }
        >
            <div className={ styles.mixedColorValues }>
                <div>
                    { !isTransparentMixedColor && (
                        <label htmlFor="mixed-color">
                            Mixed Color
                        </label>
                    ) }

                    <div id="mixed-color">
                        { !isTransparentMixedColor && (
                            <p>
                                { (tinycolor(normalizeRgbString(mixedColor)).toHexString()) }
                            </p>
                        ) }

                        { !isTransparentMixedColor && (
                            <p>
                                { mixedColorName }
                            </p>
                        ) }
                    </div>
                </div>

                { isUsingTargetColor && (
                    <div className={ styles.matchPct }
                        style={ { color: tinycolor(mixedColor).isDark() ? 'white' : 'black' } }
                    >
                        <label>Target Match</label>
                        <div>{ matchPercentage }%</div>
                    </div>
                ) }
            </div>
        </section>
    )
}

export default MixedColorContainer
